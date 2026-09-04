"use client";

import { useEffect, useState } from "react";
import type { LiveCatalogue } from "@/lib/catalogue";

export function useLiveCatalogue() {
  const [data, setData] = useState<LiveCatalogue | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/catalogue")
      .then((response) => response.json())
      .then((payload: LiveCatalogue) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) {
          setData({ products: [], brands: [], ads: [], collections: [], tablesReady: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
