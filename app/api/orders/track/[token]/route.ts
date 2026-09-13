import { NextResponse } from "next/server";
import { TRACKING_SQL_HINT } from "@/lib/connect";
import { confirmOrderReceived, publicOrderView, refreshOrderTracking, type OrderRow } from "@/lib/orders-fulfill";
import { T } from "@/lib/tables";
import { createServiceClient } from "@/lib/supabase/service";
import { isMissingColumn } from "@/lib/appearance";

async function loadByToken(token: string) {
  const supabase = createServiceClient();
  if (!supabase) return { error: "Service role is required.", status: 503 as const };
  const { data, error } = await supabase.from(T.orders).select("*").eq("track_token", token).maybeSingle();
  if (error) {
    return {
      error: isMissingColumn(error) ? TRACKING_SQL_HINT : error.message,
      status: 400 as const,
    };
  }
  if (!data) return { error: "Order not found.", status: 404 as const };
  return { order: data as OrderRow };
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const loaded = await loadByToken(token);
  if (!("order" in loaded) || !loaded.order) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }
  const refreshed = await refreshOrderTracking(loaded.order);
  return NextResponse.json({ order: publicOrderView(refreshed) });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  const loaded = await loadByToken(token);
  if (!("order" in loaded) || !loaded.order) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }
  if (body.action !== "confirm") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  try {
    const updated = await confirmOrderReceived(loaded.order);
    return NextResponse.json({ order: publicOrderView(updated) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not confirm." }, { status: 400 });
  }
}
