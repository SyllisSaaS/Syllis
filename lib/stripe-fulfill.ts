import type Stripe from "stripe";
import { isBrandPlan, isPlanId, type AccountRole, type PlanId } from "./plans";
import { T } from "./tables";
import { createClient } from "./supabase/server";
import { createServiceClient } from "./supabase/service";
import { getStripe } from "./stripe";

async function db() {
  return createServiceClient() ?? (await createClient());
}

function roleAfterPlan(current: AccountRole | string | null | undefined, plan: PlanId): AccountRole {
  if (current === "admin") return "admin";
  if (isBrandPlan(plan)) return "brand";
  if (current === "stylist") return "stylist";
  return "shopper";
}

export async function applyPlanCheckoutSession(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;
  if (!userId || !isPlanId(plan) || plan === "free") {
    return { error: "Not a Syllis plan checkout." };
  }
  if (session.status && session.status !== "complete") {
    return { error: "Checkout is not complete yet." };
  }

  const supabase = await db();
  if (!supabase) return { error: "Database is not configured." };

  const { data: existing } = await supabase.from(T.profiles).select("role").eq("id", userId).maybeSingle();
  const stripe = getStripe();
  let trialEndsAt: string | null = null;
  let subscriptionStatus = "trialing";
  let subscriptionId: string | null = typeof session.subscription === "string" ? session.subscription : null;

  if (stripe && subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    subscriptionStatus = subscription.status;
    trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
  }

  await supabase
    .from(T.profiles)
    .update({
      plan,
      role: roleAfterPlan(existing?.role as string | undefined, plan),
      stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
      stripe_subscription_id: subscriptionId,
      subscription_status: subscriptionStatus,
      trial_ends_at: trialEndsAt,
    })
    .eq("id", userId);

  return { ok: true, plan, userId };
}
