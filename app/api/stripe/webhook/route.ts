import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { isBrandPlan, isPlanId, type PlanId } from "@/lib/plans";
import { expireAndPromoteAds, fulfillAdBooking } from "@/lib/ads-fulfill";
import { applyPlanCheckoutSession } from "@/lib/stripe-fulfill";
import { getStripe, planFromPriceId, storedPriceMap } from "@/lib/stripe";
import { T } from "@/lib/tables";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

async function db() {
  return createServiceClient() ?? (await createClient());
}

async function updateProfile(userId: string, fields: Record<string, string | null | boolean>) {
  const supabase = await db();
  if (!supabase) return;
  await supabase.from(T.profiles).update(fields).eq("id", userId);
}

async function recordLedger(input: {
  source: "subscription" | "stylist_cut" | "ad" | "other";
  amountPence: number;
  description: string;
  userId?: string | null;
  stripeId?: string | null;
}) {
  const supabase = await db();
  if (!supabase || input.amountPence <= 0) return;
  await supabase.from(T.ledger).insert({
    source: input.source,
    amount_pence: input.amountPence,
    currency: "gbp",
    description: input.description,
    user_id: input.userId ?? null,
    stripe_id: input.stripeId ?? null,
  });
}

function planFromSubscription(
  subscription: Stripe.Subscription,
  stored: Partial<Record<string, string>>
): PlanId | null {
  const meta = subscription.metadata?.plan;
  if (isPlanId(meta) && meta !== "free") return meta;
  const priceId = subscription.items.data[0]?.price?.id;
  const fromEnv = planFromPriceId(priceId);
  if (fromEnv) return fromEnv;
  if (!priceId) return null;
  const hit = Object.entries(stored).find(([, id]) => id === priceId);
  return hit && isPlanId(hit[0]) && hit[0] !== "free" ? hit[0] : null;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.kind === "ad") {
      await fulfillAdBooking({
        bookingId: session.metadata.bookingId,
        sessionId: session.id,
        userId: session.metadata.userId,
        amountPence: session.amount_total ?? 0,
      });
      await expireAndPromoteAds();
      if (session.metadata.userId && typeof session.customer === "string") {
        await updateProfile(session.metadata.userId, { stripe_customer_id: session.customer });
      }
    } else {
      await applyPlanCheckoutSession(session);
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const subscription = event.data.object as Stripe.Subscription;
    const stored = await storedPriceMap();
    const userId = subscription.metadata?.userId;
    const plan = planFromSubscription(subscription, stored);
    if (userId && plan) {
      const supabase = await db();
      const { data: existing } = supabase
        ? await supabase.from(T.profiles).select("role").eq("id", userId).maybeSingle()
        : { data: null };
      const keepAdmin = existing?.role === "admin";
      const trialEnd = subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null;
      await updateProfile(userId, {
        plan,
        role: keepAdmin ? "admin" : isBrandPlan(plan) ? "brand" : "shopper",
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        trial_ends_at: trialEnd,
        stripe_customer_id:
          typeof subscription.customer === "string" ? subscription.customer : null,
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    const wasBrand = isBrandPlan(subscription.metadata?.plan);
    if (userId) {
      await updateProfile(userId, {
        plan: wasBrand ? "starter" : "free",
        subscription_status: "canceled",
        stripe_subscription_id: null,
      });
    }
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice & {
      subscription?: string | { id?: string } | null;
      subscription_details?: { metadata?: { userId?: string } };
      parent?: { subscription_details?: { metadata?: { userId?: string }; subscription?: string } };
    };
    const subscriptionId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription && typeof invoice.subscription === "object"
          ? invoice.subscription.id
          : invoice.parent?.subscription_details?.subscription;
    if (!subscriptionId) {
      return NextResponse.json({ received: true });
    }
    const userId =
      invoice.subscription_details?.metadata?.userId ??
      invoice.parent?.subscription_details?.metadata?.userId ??
      invoice.metadata?.userId;
    const amount = invoice.amount_paid ?? 0;
    await recordLedger({
      source: "subscription",
      amountPence: amount,
      description: invoice.billing_reason || "Subscription invoice",
      userId: typeof userId === "string" ? userId : null,
      stripeId: invoice.id,
    });
  }

  return NextResponse.json({ received: true });
}
