import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { isAdDays, isAdPlacement, quoteAdPence, adSlotCap, adSurfaceLabel } from "@/lib/ads";
import { countRenewals, expireAndPromoteAds, liveAdCount } from "@/lib/ads-fulfill";

export async function GET(request: Request) {
  const profile = await getProfile();
  const url = new URL(request.url);
  const placement = url.searchParams.get("placement") ?? "All";
  const days = Number(url.searchParams.get("days") ?? "3");
  if (!isAdPlacement(placement) || !isAdDays(days)) {
    return NextResponse.json({ error: "Invalid placement or days." }, { status: 400 });
  }
  await expireAndPromoteAds();
  const renewals = profile ? await countRenewals(profile.id, placement) : 0;
  const used = await liveAdCount(placement);
  const cap = adSlotCap(placement);
  return NextResponse.json({
    placement,
    label: adSurfaceLabel(placement),
    days,
    renewals,
    amountPence: quoteAdPence(placement, days, renewals),
    cap,
    used,
    remaining: Math.max(0, cap - used),
  });
}
