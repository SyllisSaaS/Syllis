"use client";

import { useEffect } from "react";
import type { AnalyticsEventName } from "@/lib/analytics";
import { trackEvent } from "@/lib/track";

export function Track({
  name,
  productId,
  brandSlug,
}: {
  name: AnalyticsEventName;
  productId?: string;
  brandSlug?: string;
}) {
  useEffect(() => {
    trackEvent(name, { productId, brandSlug });
  }, [name, productId, brandSlug]);
  return null;
}
