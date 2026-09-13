import { NextResponse } from "next/server";
import { TRACKING_SQL_HINT } from "@/lib/connect";
import { ensureTrackTokens, type OrderRow } from "@/lib/orders-fulfill";
import { T } from "@/lib/tables";
import { createServiceClient } from "@/lib/supabase/service";
import { isMissingColumn } from "@/lib/appearance";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; orderId?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  const orderId = String(body.orderId ?? "").trim().toLowerCase();
  if (!email || !orderId) {
    return NextResponse.json({ error: "Enter the email from checkout and the order id." }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Service role is required." }, { status: 503 });

  const { data, error } = await supabase
    .from(T.orders)
    .select("*")
    .eq("buyer_email", email)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: isMissingColumn(error) ? TRACKING_SQL_HINT : error.message }, { status: 400 });
  }

  const matches = ((data ?? []) as OrderRow[]).filter(
    (order) => order.id.toLowerCase() === orderId || order.id.replace(/-/g, "").startsWith(orderId.replace(/-/g, ""))
  );
  if (matches.length !== 1) {
    return NextResponse.json({ error: "No order matched that email and id." }, { status: 404 });
  }

  const [order] = await ensureTrackTokens(matches);
  if (!order.track_token) {
    return NextResponse.json({ error: TRACKING_SQL_HINT }, { status: 400 });
  }
  return NextResponse.json({ token: order.track_token });
}
