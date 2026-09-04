"use client";

import { isAnalyticsEventName, type AnalyticsEventName } from "@/lib/analytics";

export function trackEvent(
  name: AnalyticsEventName,
  extra?: { path?: string; productId?: string; brandSlug?: string }
) {
  if (!isAnalyticsEventName(name)) return;
  const body = {
    name,
    path: extra?.path ?? (typeof window !== "undefined" ? window.location.pathname : null),
    productId: extra?.productId,
    brandSlug: extra?.brandSlug,
  };
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", new Blob([JSON.stringify(body)], { type: "application/json" }));
      return;
    }
  } catch {
    // Fall through to fetch.
  }
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);
}
