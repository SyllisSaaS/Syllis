/** Founding-brand year: 1 month free, 2 months 90% off, then 75 / 50 / 25 for 3 months each. */

export const STYLIST_PLATFORM_CUT = 0.05;

export type FoundingBand = {
  fromMonth: number;
  toMonth: number;
  percentOff: number;
  label: string;
};

export const FOUNDING_BANDS: FoundingBand[] = [
  { fromMonth: 0, toMonth: 1, percentOff: 100, label: "Month 1 — free" },
  { fromMonth: 1, toMonth: 3, percentOff: 90, label: "Months 2–3 — 90% off" },
  { fromMonth: 3, toMonth: 6, percentOff: 75, label: "Months 4–6 — 75% off" },
  { fromMonth: 6, toMonth: 9, percentOff: 50, label: "Months 7–9 — 50% off" },
  { fromMonth: 9, toMonth: 12, percentOff: 25, label: "Months 10–12 — 25% off" },
];

export function monthsSince(start: string | Date, now = new Date()) {
  const from = new Date(start);
  const years = now.getFullYear() - from.getFullYear();
  const months = years * 12 + (now.getMonth() - from.getMonth());
  const adjust = now.getDate() < from.getDate() ? -1 : 0;
  return Math.max(0, months + adjust);
}

export function foundingOffer(startedAt: string | Date | null | undefined, now = new Date()) {
  if (!startedAt) {
    return { active: false, percentOff: 0, months: 0, band: null as FoundingBand | null, label: "Standard pricing" };
  }
  const months = monthsSince(startedAt, now);
  if (months >= 12) {
    return { active: false, percentOff: 0, months, band: null, label: "Founding year complete — full price" };
  }
  const band = FOUNDING_BANDS.find((item) => months >= item.fromMonth && months < item.toMonth) ?? null;
  return {
    active: true,
    percentOff: band?.percentOff ?? 0,
    months,
    band,
    label: band?.label ?? "Founding year",
  };
}

export function discountedMonthly(basePrice: number, percentOff: number) {
  return Math.round(basePrice * (1 - percentOff / 100) * 100) / 100;
}
