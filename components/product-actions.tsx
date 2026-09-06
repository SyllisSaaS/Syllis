"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/lib/data";
import { trackEvent } from "@/lib/track";
import { ReportButton } from "@/components/report-button";

export function ProductActions({
  product,
  brandSlug,
  dropId,
  canBuy,
  paymentsOn,
}: {
  product: Product;
  brandSlug: string;
  dropId: string | null;
  canBuy: boolean;
  paymentsOn: boolean;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function buy() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "product", productSlug: product.slug }),
    });
    const payload = (await response.json()) as { url?: string; error?: string };
    if (payload.url) {
      window.location.href = payload.url;
      return;
    }
    setMessage(payload.error || "Could not start checkout.");
    setBusy(false);
  }

  async function reserve() {
    if (!dropId) return;
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/reserves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dropId, size: "M" }),
    });
    const payload = (await response.json()) as { error?: string };
    setMessage(payload.error || "Hold placed for 30 minutes. Find it in Saved → Reserved.");
    setBusy(false);
  }

  return (
    <div className="mt-8 grid gap-3">
      {canBuy ? (
        <button type="button" className="button button-dark w-full" disabled={busy} onClick={() => void buy()}>
          {busy ? "Opening checkout..." : "Buy on Syllis"}
        </button>
      ) : paymentsOn ? (
        <p className="text-xs text-[color:var(--muted)]">This label is not taking Syllis checkout yet.</p>
      ) : (
        <p className="text-xs text-[color:var(--muted)]">Syllis checkout is paused. Nothing will be charged.</p>
      )}
      <button
        type="button"
        className="button button-quiet w-full"
        data-cursor="SHOP"
        onClick={() => trackEvent("outbound_click", { productId: product.id, brandSlug })}
      >
        Visit retailer <ArrowRight size={15} />
      </button>
      {dropId && (
        <button type="button" className="button button-quiet w-full" onClick={reserve} disabled={busy}>
          {busy ? "Holding..." : "Reserve drop unit"}
        </button>
      )}
      {dropId && (
        <Link href="/drops" className="text-center text-xs underline underline-offset-4">
          See drop windows
        </Link>
      )}
      {message && <p className="text-xs text-[color:var(--muted)]">{message}</p>}
      <ReportButton targetType="product" targetId={product.id} />
    </div>
  );
}
