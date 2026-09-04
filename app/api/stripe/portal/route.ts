import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { isStripeConfigured, siteUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }
  if (!profile.stripe_customer_id) {
    return NextResponse.json({ error: "No billing customer yet. Start a plan first." }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl()}/profile`,
  });

  return NextResponse.json({ url: session.url });
}
