import { adPricing, adRenewalPrice, isStyleName, styles, type AdPlacement } from "./data";

export const AD_DAYS = [3, 7] as const;
export type AdDays = (typeof AD_DAYS)[number];

export function isAdPlacement(value: string): value is AdPlacement {
  return value === "All" || value === "Brand" || value === "Drop" || isStyleName(value);
}

export function isAdDays(value: number): value is AdDays {
  return value === 3 || value === 7;
}

export function adSurfaceLabel(placement: AdPlacement) {
  if (placement === "All") return "All Syllis";
  if (placement === "Brand") return "Brand slot";
  if (placement === "Drop") return "Drop slot";
  return `${placement} niche`;
}

export function adSlotCap(placement: AdPlacement) {
  if (placement === "All") return adPricing.slots.all;
  if (placement === "Brand") return adPricing.slots.brand;
  if (placement === "Drop") return adPricing.slots.drop;
  return adPricing.slots.niche;
}

export function adBasePounds(placement: AdPlacement, days: AdDays) {
  if (placement === "All") return adPricing.all[days];
  if (placement === "Brand") return adPricing.brand[days];
  if (placement === "Drop") return adPricing.drop[days];
  return adPricing.niche[days];
}

export function quoteAdPence(placement: AdPlacement, days: AdDays, timesRenewed: number) {
  return adRenewalPrice(adBasePounds(placement, days), timesRenewed) * 100;
}

export function placementOptions(): AdPlacement[] {
  return ["All", "Brand", "Drop", ...styles];
}

export function integrationTag(kind: string) {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `syllis_${kind}_${suffix}`;
}
