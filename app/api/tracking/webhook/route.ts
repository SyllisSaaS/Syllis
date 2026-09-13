import { NextResponse } from "next/server";
import { applyTrackingLookup } from "@/lib/orders-fulfill";
import { parseTrackingWebhook } from "@/lib/tracking-lookup";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = parseTrackingWebhook(body);
  if (!parsed) {
    return NextResponse.json({ received: true, matched: 0 });
  }

  const matched = await applyTrackingLookup(parsed.number, parsed.lookup);
  return NextResponse.json({ received: true, matched, status: parsed.lookup.status });
}
