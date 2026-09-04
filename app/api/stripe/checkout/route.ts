import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { isStripeConfigured, siteUrl } from "@/lib/env";
import { foundingOffer } from "@/lib/founding";
import { isBrandPlan, isPlanId, TRIAL_DAYS, type PlanId } from "@/lib/plans";
import { foundingCheckoutDiscount, getStripe, resolvePriceId } from "@/lib/stripe";
import { adSlotCap, adSurfaceLabel, isAdDays, isAdPlacement, quoteAdPence } from "@/lib/ads";
import { countRenewals, expireAndPromoteAds, liveAdCount } from "@/lib/ads-fulfill";
import { T } from "@/lib/tables";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY, then create products from Admin → Payments." },
      { status: 503 }
    );
  }

  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  let body: {
    kind?: string;
    plan?: string;
    placement?: string;
    days?: number;
    title?: string;
    brand?: string;
    image?: string;
    productSlug?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  if (body.kind === "ad") {
    if (profile.role !== "brand" && profile.role !== "admin") {
      return NextResponse.json({ error: "Ad slots are for brand accounts." }, { status: 403 });
    }
    const placement = body.placement ?? "";
    const days = Number(body.days);
    if (!isAdPlacement(placement) || !isAdDays(days)) {
      return NextResponse.json({ error: "Pick a placement and 3 or 7 days." }, { status: 400 });
    }
    const title = String(body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "Give the ad a title." }, { status: 400 });

    await expireAndPromoteAds();
    const used = await liveAdCount(placement);
    if (used >= adSlotCap(placement)) {
      return NextResponse.json(
        { error: `${adSurfaceLabel(placement)} is full right now (${adSlotCap(placement)} slots).` },
        { status: 409 }
      );
    }

    const renewals = await countRenewals(profile.id, placement);
    const amountPence = quoteAdPence(placement, days, renewals);
    const supabase = createServiceClient() ?? (await createClient());
    if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

    const { data: booking, error } = await supabase
      .from(T.adBookings)
      .insert({
        user_id: profile.id,
        placement,
        days,
        amount_pence: amountPence,
        renewals,
        title,
        brand: String(body.brand ?? profile.full_name ?? "Syllis brand"),
        image: String(body.image ?? ""),
        product_slug: body.productSlug ? String(body.productSlug) : null,
        status: "pending",
      })
      .select("*")
      .single();
    if (error || !booking) {
      return NextResponse.json(
        { error: error?.message || "Could not start booking. Paste supabase/payments.sql if tables are missing." },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: profile.stripe_customer_id ?? undefined,
      customer_email: profile.stripe_customer_id ? undefined : profile.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: amountPence,
            product_data: {
              name: `${adSurfaceLabel(placement)} · ${days} days`,
              description:
                renewals > 0
                  ? `Renewal ${Math.min(renewals, 4)} of 4 (+45% steps, then this price holds).`
                  : "First booking at the base rate.",
            },
          },
        },
      ],
      metadata: {
        kind: "ad",
        userId: profile.id,
        bookingId: booking.id,
        placement,
        days: String(days),
      },
      success_url: `${siteUrl()}/studio?ad=success`,
      cancel_url: `${siteUrl()}/studio?ad=cancel`,
    });

    await supabase
      .from(T.adBookings)
      .update({ stripe_session_id: session.id })
      .eq("id", booking.id);

    if (typeof session.customer === "string") {
      await supabase.from(T.profiles).update({ stripe_customer_id: session.customer }).eq("id", profile.id);
    }

    return NextResponse.json({ url: session.url, amountPence, renewals });
  }

  let plan: Exclude<PlanId, "free"> = "early";
  if (isPlanId(body.plan) && body.plan !== "free") plan = body.plan;

  if (isBrandPlan(plan) && profile.role === "shopper") {
    return NextResponse.json(
      { error: "Brand plans need a brand account. Sign up as a brand first." },
      { status: 400 }
    );
  }

  if (plan === "early" && profile.role === "brand") {
    return NextResponse.json({ error: "Brand accounts use seller plans." }, { status: 400 });
  }

  const price = await resolvePriceId(plan);
  if (!price) {
    return NextResponse.json(
      {
        error: `No Stripe price for ${plan}. Open Admin → Payments and create the Syllis products, or set STRIPE_PRICE_${plan.toUpperCase()}.`,
      },
      { status: 503 }
    );
  }

  const founding =
    (isBrandPlan(plan) && profile.founding_brand) || (plan === "early" && profile.founding_member);
  const offer = foundingOffer(founding ? profile.founding_started_at : null);
  const discount = await foundingCheckoutDiscount(offer);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: profile.stripe_customer_id ?? undefined,
    customer_email: profile.stripe_customer_id ? undefined : profile.email ?? undefined,
    line_items: [{ price, quantity: 1 }],
    ...(discount.discounts ? { discounts: discount.discounts } : {}),
    subscription_data: {
      ...(discount.trialPeriodDays || !offer.active
        ? { trial_period_days: discount.trialPeriodDays ?? TRIAL_DAYS }
        : {}),
      metadata: {
        userId: profile.id,
        plan,
        role: profile.role,
        founding: offer.active ? "1" : "0",
        founding_percent: String(offer.percentOff),
      },
    },
    metadata: {
      kind: "plan",
      userId: profile.id,
      plan,
      role: profile.role,
    },
    success_url: `${siteUrl()}/profile?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/pricing?checkout=cancel`,
  });

  const supabase = await createClient();
  if (supabase && typeof session.customer === "string") {
    await supabase
      .from(T.profiles)
      .update({ stripe_customer_id: session.customer })
      .eq("id", profile.id);
  }

  return NextResponse.json({ url: session.url });
}
