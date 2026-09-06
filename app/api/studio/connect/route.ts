import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import {
  ensureConnectAccount,
  isPayoutsReady,
  ORDERS_SQL_HINT,
  retrieveConnectAccount,
  saleTakeRate,
  sellerPlanFromProfile,
} from "@/lib/connect";
import { isStripeConfigured } from "@/lib/env";
import { canUseStudio, profileEntitlements } from "@/lib/profile";
import { getStripe } from "@/lib/stripe";
import { ensureStudioBrand } from "@/lib/studio";
import { T } from "@/lib/tables";
import { createServiceClient } from "@/lib/supabase/service";
import { isMissingColumn } from "@/lib/appearance";

export async function GET() {
  const profile = await getProfile();
  if (!profile || !canUseStudio(profile)) {
    return NextResponse.json({ error: "Brand accounts only." }, { status: 403 });
  }

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Service role is required." }, { status: 503 });

  const ensured = await ensureStudioBrand(supabase, profile);
  if (!ensured.brand) return NextResponse.json({ error: ensured.error, needsSql: ensured.needsSql }, { status: 400 });

  const connectId = typeof ensured.brand.stripe_connect_id === "string" ? ensured.brand.stripe_connect_id : "";
  const take = saleTakeRate(sellerPlanFromProfile(profileEntitlements(profile).plan));
  let payoutsReady = Boolean(ensured.brand.payouts_ready);

  if (connectId && isStripeConfigured()) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const account = await retrieveConnectAccount(stripe, connectId);
        payoutsReady = isPayoutsReady(account);
        const { error } = await supabase
          .from(T.brands)
          .update({ payouts_ready: payoutsReady })
          .eq("id", ensured.brand.id);
        if (error && isMissingColumn(error)) {
          return NextResponse.json({ error: ORDERS_SQL_HINT, needsSql: true }, { status: 400 });
        }
      } catch {
        payoutsReady = false;
      }
    }
  }

  return NextResponse.json({
    connected: Boolean(connectId),
    payoutsReady,
    takeRate: take,
    needsSql: false,
  });
}

export async function POST() {
  const profile = await getProfile();
  if (!profile || !canUseStudio(profile)) {
    return NextResponse.json({ error: "Brand accounts only." }, { status: 403 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
  }

  try {
    const result = await ensureConnectAccount(profile);
    if (result.error) {
      return NextResponse.json(
        { error: result.error, needsSql: result.error === ORDERS_SQL_HINT },
        { status: 400 }
      );
    }
    return NextResponse.json({
      url: result.url,
      ready: "ready" in result ? result.ready : false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start payouts.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
