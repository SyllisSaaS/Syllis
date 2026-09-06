import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { ORDERS_SQL_HINT } from "@/lib/connect";
import { releaseOrderTransfer, type OrderRow } from "@/lib/orders-fulfill";
import { canUseStudio } from "@/lib/profile";
import { isMissingColumn } from "@/lib/appearance";
import { ensureStudioBrand } from "@/lib/studio";
import { T } from "@/lib/tables";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const profile = await getProfile();
  if (!profile || !canUseStudio(profile)) {
    return NextResponse.json({ error: "Brand accounts only." }, { status: 403 });
  }

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Service role is required." }, { status: 503 });

  const { data, error } = await supabase
    .from(T.orders)
    .select("*")
    .eq("brand_user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    return NextResponse.json(
      { error: isMissingColumn(error) || error.message.includes("syllis_orders") ? ORDERS_SQL_HINT : error.message, needsSql: true },
      { status: 400 }
    );
  }

  return NextResponse.json({ orders: data ?? [] });
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || !canUseStudio(profile)) {
    return NextResponse.json({ error: "Brand accounts only." }, { status: 403 });
  }

  const body = (await request.json()) as { orderId?: string; trackingNumber?: string };
  const orderId = String(body.orderId ?? "");
  const trackingNumber = String(body.trackingNumber ?? "").trim();
  if (!orderId) return NextResponse.json({ error: "Missing order." }, { status: 400 });
  if (trackingNumber.length < 4) {
    return NextResponse.json({ error: "Add a tracking number before we release the money." }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Service role is required." }, { status: 503 });

  const ensured = await ensureStudioBrand(supabase, profile);
  if (!ensured.brand) return NextResponse.json({ error: ensured.error }, { status: 400 });

  const connectId = typeof ensured.brand.stripe_connect_id === "string" ? ensured.brand.stripe_connect_id : "";
  if (!connectId || !ensured.brand.payouts_ready) {
    return NextResponse.json({ error: "Finish payout setup in Studio first." }, { status: 400 });
  }

  const { data: order, error } = await supabase.from(T.orders).select("*").eq("id", orderId).maybeSingle();
  if (error) {
    return NextResponse.json({ error: isMissingColumn(error) ? ORDERS_SQL_HINT : error.message }, { status: 400 });
  }
  if (!order || order.brand_user_id !== profile.id) {
    return NextResponse.json({ error: "That order is not yours." }, { status: 403 });
  }
  if (order.status !== "paid" && order.status !== "shipped") {
    return NextResponse.json({ error: "This order is not waiting to ship." }, { status: 400 });
  }

  try {
    const updated = await releaseOrderTransfer(order as OrderRow, trackingNumber, connectId);
    return NextResponse.json({ order: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not release payout." }, { status: 400 });
  }
}
