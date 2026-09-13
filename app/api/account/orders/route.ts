import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { TRACKING_SQL_HINT } from "@/lib/connect";
import { ensureTrackTokens, publicOrderView, type OrderRow } from "@/lib/orders-fulfill";
import { T } from "@/lib/tables";
import { createServiceClient } from "@/lib/supabase/service";
import { isMissingColumn } from "@/lib/appearance";

export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Log in first." }, { status: 401 });

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Service role is required." }, { status: 503 });

  const filters = [`buyer_user_id.eq.${profile.id}`];
  if (profile.email) filters.push(`buyer_email.eq.${profile.email}`);
  const { data, error } = await supabase
    .from(T.orders)
    .select("*")
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    return NextResponse.json({ error: isMissingColumn(error) ? TRACKING_SQL_HINT : error.message }, { status: 400 });
  }

  const rows = await ensureTrackTokens((data ?? []) as OrderRow[]);
  return NextResponse.json({
    orders: rows.map((order) => ({
      ...publicOrderView(order),
      token: order.track_token,
    })),
  });
}
