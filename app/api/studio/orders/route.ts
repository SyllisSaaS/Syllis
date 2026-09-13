import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { isMissingColumn } from "@/lib/appearance";
import { ORDERS_SQL_HINT, TRACKING_SQL_HINT } from "@/lib/connect";
import {
  ensureTrackTokens,
  releaseIfVerified,
  submitOrderTracking,
  syncPaidCheckoutSessions,
  syncShippedTracking,
  type OrderRow,
} from "@/lib/orders-fulfill";
import { canUseStudio } from "@/lib/profile";
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

  const ensured = await ensureStudioBrand(supabase, profile);

  const fetchOrders = () => {
    let query = supabase.from(T.orders).select("*").order("created_at", { ascending: false }).limit(80);
    if (profile.role !== "admin") {
      const filters = [`brand_user_id.eq.${profile.id}`];
      if (ensured.brand?.id) filters.push(`brand_id.eq.${ensured.brand.id}`);
      if (ensured.brand?.slug) filters.push(`brand_slug.eq.${ensured.brand.slug}`);
      query = query.or(filters.join(","));
    }
    return query;
  };

  const first = await fetchOrders();
  if (first.error) {
    const tracking =
      (first.error.message || "").includes("track_token") ||
      (first.error.message || "").includes("tracking_");
    return NextResponse.json(
      {
        error:
          isMissingColumn(first.error) || first.error.message.includes("syllis_orders")
            ? tracking
              ? TRACKING_SQL_HINT
              : ORDERS_SQL_HINT
            : first.error.message,
        needsSql: true,
      },
      { status: 400 }
    );
  }

  const rows = (first.data ?? []) as OrderRow[];
  await syncPaidCheckoutSessions(rows);
  const withTokens = await ensureTrackTokens(rows);
  await syncShippedTracking(withTokens);
  const second = await fetchOrders();
  return NextResponse.json({
    orders: (second.data ?? withTokens) as OrderRow[],
    admin: profile.role === "admin",
  });
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || !canUseStudio(profile)) {
    return NextResponse.json({ error: "Brand accounts only." }, { status: 403 });
  }

  const body = (await request.json()) as {
    orderId?: string;
    trackingNumber?: string;
    carrier?: string;
    action?: string;
  };
  const orderId = String(body.orderId ?? "");
  const trackingNumber = String(body.trackingNumber ?? "").trim();
  const carrier = String(body.carrier ?? "").trim();
  const action = String(body.action ?? "ship");
  if (!orderId) return NextResponse.json({ error: "Missing order." }, { status: 400 });

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Service role is required." }, { status: 503 });

  const ensured = await ensureStudioBrand(supabase, profile);
  if (!ensured.brand) return NextResponse.json({ error: ensured.error }, { status: 400 });

  const { data: order, error } = await supabase.from(T.orders).select("*").eq("id", orderId).maybeSingle();
  if (error) {
    return NextResponse.json({ error: isMissingColumn(error) ? TRACKING_SQL_HINT : error.message }, { status: 400 });
  }

  const owns =
    order &&
    (order.brand_user_id === profile.id ||
      order.brand_id === ensured.brand.id ||
      order.brand_slug === ensured.brand.slug ||
      profile.role === "admin");
  if (!order || !owns) {
    return NextResponse.json({ error: "That order is not yours." }, { status: 403 });
  }

  try {
    if (action === "release") {
      if (profile.role !== "admin") {
        return NextResponse.json({ error: "Only Syllis can force a payout." }, { status: 403 });
      }
      const updated = await releaseIfVerified(order as OrderRow, true);
      return NextResponse.json({ order: updated });
    }

    const updated = await submitOrderTracking(order as OrderRow, trackingNumber, carrier);
    return NextResponse.json({ order: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not save tracking." }, { status: 400 });
  }
}
