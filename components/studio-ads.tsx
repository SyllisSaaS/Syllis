"use client";

import { useEffect, useState } from "react";
import { placementOptions } from "@/lib/ads";

function money(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

export function StudioAds({
  defaultBrand: _defaultBrand,
}: {
  defaultBrand: string;
  productSlug?: string;
}) {
  const [placement, setPlacement] = useState("All");
  const [days, setDays] = useState(3);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [quote, setQuote] = useState<{
    amountPence: number;
    renewals: number;
    remaining: number;
    cap: number;
    label: string;
  } | null>(null);
  useEffect(() => {
    const url = `/api/ads/quote?placement=${encodeURIComponent(placement)}&days=${days}`;
    fetch(url)
      .then((r) => r.json())
      .then((payload) => {
        if (payload.error) return;
        setQuote(payload);
      })
      .catch(() => undefined);
  }, [placement, days]);

  return (
    <div className="panel border hairline p-6">
      <p className="eyebrow">Advertise</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-.03em]">Book a slot.</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[color:var(--muted)]">
        All Syllis is the home feed. Niches are cheaper. Brand and drop slots cost more. Each time
        you renew the same surface, the price goes up 45% for four renewals, then it stays there.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Headline"
          className="border hairline bg-transparent px-3 py-2 text-sm"
        />
        <input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="Image URL"
          className="border hairline bg-transparent px-3 py-2 text-sm"
        />
        <select
          value={placement}
          onChange={(e) => setPlacement(e.target.value)}
          className="border hairline bg-transparent px-3 py-2 text-sm"
        >
          {placementOptions().map((item) => (
            <option key={item} value={item}>
              {item === "All" ? "All Syllis" : item}
            </option>
          ))}
        </select>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border hairline bg-transparent px-3 py-2 text-sm"
        >
          <option value={3}>3 days</option>
          <option value={7}>7 days</option>
        </select>
      </div>
      {quote && (
        <p className="mt-4 text-sm">
          {quote.label}: {money(quote.amountPence)} · {quote.remaining} of {quote.cap} slots free
          {quote.renewals > 0 ? ` · renewal ${Math.min(quote.renewals, 4)}` : " · first booking"}
        </p>
      )}
      <button type="button" className="button button-dark mt-6" disabled>
        Payments paused
      </button>
      <p className="mt-3 text-xs text-[color:var(--muted)]">
        Ad checkout is off for now. No money will be taken in or out.
      </p>
    </div>
  );
}
