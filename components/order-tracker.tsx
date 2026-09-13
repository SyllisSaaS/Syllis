"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackerEmbedUrl, trackingStatusLabel } from "@/lib/tracking";

type PublicOrder = {
  id: string;
  product_name: string;
  brand_slug: string | null;
  amount_pence: number;
  status: string;
  tracking_number: string | null;
  tracking_carrier: string | null;
  tracking_status: string | null;
  tracking_url: string | null;
  tracking_events: { at: string; status: string; message: string }[];
  tracking_verified: boolean;
  buyer_confirmed: boolean;
  shipped_at: string | null;
  created_at: string;
  shipping: { name?: string | null; address?: Record<string, string | null> | null } | null;
};

function money(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

function stepDone(order: PublicOrder, step: "paid" | "shipped" | "scanned" | "delivered") {
  if (step === "paid") return order.status !== "pending";
  if (step === "shipped") {
    return Boolean(order.tracking_number) || order.status === "shipped" || order.status === "transferred";
  }
  if (step === "scanned") {
    return (
      order.tracking_status === "in_transit" ||
      order.tracking_status === "out_for_delivery" ||
      order.tracking_status === "delivered" ||
      order.buyer_confirmed
    );
  }
  return order.tracking_status === "delivered" || order.buyer_confirmed || order.status === "transferred";
}

export function OrderTracker({ token }: { token: string }) {
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(`/api/orders/track/${token}`);
    const data = (await res.json()) as { order?: PublicOrder; error?: string };
    if (!res.ok || !data.order) {
      setError(data.error || "Could not load this order.");
      return;
    }
    setOrder(data.order);
    setError("");
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(timer);
  }, [token]);

  async function confirm() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/orders/track/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm" }),
    });
    const data = (await res.json()) as { order?: PublicOrder; error?: string };
    setBusy(false);
    if (!res.ok || !data.order) {
      setError(data.error || "Could not confirm this order.");
      return;
    }
    setOrder(data.order);
  }

  if (!order && !error) {
    return <p className="text-sm text-[color:var(--muted)]">Loading your order…</p>;
  }

  if (!order) {
    return (
      <div>
        <h1 className="text-5xl font-semibold tracking-[-.06em]">Order not found.</h1>
        <p className="mt-4 max-w-md text-sm text-[color:var(--muted)]">{error}</p>
        <Link href="/order" className="button button-dark mt-8">
          Find an order
        </Link>
      </div>
    );
  }

  const address = order.shipping?.address;
  const embed = trackerEmbedUrl(order.tracking_carrier, order.tracking_number);
  const steps = [
    { id: "paid" as const, label: "Paid to Syllis" },
    { id: "shipped" as const, label: "Shipped" },
    { id: "scanned" as const, label: "With the courier" },
    { id: "delivered" as const, label: "Delivered" },
  ];

  return (
    <div>
      <p className="eyebrow mb-4">Order</p>
      <h1 className="text-[clamp(44px,7vw,84px)] font-semibold leading-[.86] tracking-[-.07em]">
        {order.product_name}
      </h1>
      <p className="mt-4 max-w-xl text-sm text-[color:var(--muted)]">
        {money(order.amount_pence)} already paid
        {order.brand_slug ? ` · ${order.brand_slug}` : ""} · {trackingStatusLabel(order.tracking_status)}
      </p>
      <p className="mt-2 max-w-xl text-xs leading-5 text-[color:var(--muted)]">
        You paid Syllis at checkout. The label is paid automatically when the courier marks this
        delivered. You do not need to do anything.
      </p>

      <div className="mt-8 grid gap-2 sm:grid-cols-4">
        {steps.map((step) => (
          <div key={step.id} className="border hairline p-4">
            <p className="text-[10px] uppercase tracking-[.12em] text-[color:var(--muted)]">
              {stepDone(order, step.id) ? "Done" : "Next"}
            </p>
            <p className="mt-2 text-sm font-semibold">{step.label}</p>
          </div>
        ))}
      </div>

      {order.tracking_number && (
        <div className="mt-8 border hairline p-6">
          <p className="eyebrow">Live tracking</p>
          <p className="mt-3 text-2xl font-semibold">{order.tracking_number}</p>
          <p className="mt-2 text-xs text-[color:var(--muted)]">{trackingStatusLabel(order.tracking_status)}</p>
          {order.tracking_url && (
            <a href={order.tracking_url} target="_blank" rel="noreferrer" className="button button-dark mt-5 inline-flex">
              Open courier tracking
            </a>
          )}
        </div>
      )}

      {embed && (
        <div className="mt-6 overflow-hidden border hairline">
          <iframe
            title="Parcel tracking"
            src={embed}
            className="h-[560px] w-full bg-[color:var(--bg)]"
          />
        </div>
      )}

      {address && (
        <p className="mt-6 max-w-xl text-xs leading-5 text-[color:var(--muted)]">
          {[order.shipping?.name, address.line1, address.line2, address.city, address.postal_code, address.country]
            .filter(Boolean)
            .join(", ")}
        </p>
      )}

      {order.tracking_events.length > 0 && (
        <div className="mt-8 grid gap-2">
          {order.tracking_events
            .slice()
            .reverse()
            .map((event, index) => (
              <div key={`${event.at}-${index}`} className="border hairline p-4 text-sm">
                <p className="font-semibold">{event.message}</p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  {new Date(event.at).toLocaleString("en-GB")} · {trackingStatusLabel(event.status)}
                </p>
              </div>
            ))}
        </div>
      )}

      {!order.buyer_confirmed && order.status !== "refunded" && order.status !== "cancelled" && order.status !== "transferred" && (
        <div className="mt-8">
          <button type="button" className="button button-quiet" disabled={busy} onClick={() => void confirm()}>
            {busy ? "Saving..." : "It arrived early"}
          </button>
          <p className="mt-3 max-w-md text-xs leading-5 text-[color:var(--muted)]">
            Optional. The courier mark is enough. This is only if it got to you before tracking
            updates.
          </p>
        </div>
      )}
      {order.buyer_confirmed && <p className="mt-8 text-sm">You confirmed this arrived.</p>}
      <p className="mt-8 max-w-md text-xs leading-5 text-[color:var(--muted)]">
        Paid at checkout — a missing-parcel claim does not undo the charge. If something is wrong,{" "}
        <Link href="/help" className="underline underline-offset-4">
          contact Syllis
        </Link>
        .
      </p>
      {error && <p className="mt-4 text-xs text-[color:var(--muted)]">{error}</p>}
    </div>
  );
}
