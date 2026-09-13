"use client";

import { useEffect, useState } from "react";
import { CARRIERS, trackingStatusLabel } from "@/lib/tracking";

type Order = {
  id: string;
  product_name: string;
  buyer_email: string | null;
  amount_pence: number;
  brand_pence: number;
  platform_fee_pence: number;
  status: string;
  tracking_number: string | null;
  tracking_carrier?: string | null;
  tracking_status?: string | null;
  tracking_url?: string | null;
  tracking_verified_at?: string | null;
  buyer_confirmed_at?: string | null;
  track_token?: string | null;
  ship_by?: string | null;
  created_at: string;
  shipping: { name?: string | null; address?: Record<string, string | null> | null } | null;
};

function money(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

function statusLabel(order: Order) {
  if (order.status === "pending") return "Waiting for Stripe";
  if (order.status === "transferred") return "Sent to your Stripe";
  if (order.status === "paid") return "Held — waiting to ship";
  if (order.status === "shipped" && (order.tracking_verified_at || order.buyer_confirmed_at || order.tracking_status === "delivered")) {
    return "Delivered — sending payout";
  }
  if (order.status === "shipped") return "Held — waiting for courier delivery";
  return order.status;
}

export function StudioOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [admin, setAdmin] = useState(false);
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [carrier, setCarrier] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/studio/orders");
    const data = (await res.json()) as { orders?: Order[]; admin?: boolean; error?: string };
    if (!res.ok) {
      setError(data.error || "Could not load orders.");
      return;
    }
    setOrders(data.orders ?? []);
    setAdmin(Boolean(data.admin));
    setError("");
  }

  useEffect(() => {
    void load();
  }, []);

  async function ship(orderId: string) {
    setBusy(orderId);
    setError("");
    const res = await fetch("/api/studio/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        trackingNumber: tracking[orderId] ?? "",
        carrier: carrier[orderId] ?? "royal-mail",
        action: "ship",
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(null);
    if (!res.ok) {
      setError(data.error || "Could not save tracking.");
      return;
    }
    await load();
  }

  async function forceRelease(orderId: string) {
    setBusy(orderId);
    setError("");
    const res = await fetch("/api/studio/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action: "release" }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(null);
    if (!res.ok) {
      setError(data.error || "Could not release that order.");
      return;
    }
    await load();
  }

  const held = orders.filter((order) => order.status === "paid" || order.status === "shipped");
  const heldPence = held.reduce((sum, order) => sum + order.brand_pence, 0);
  const sentPence = orders
    .filter((order) => order.status === "transferred")
    .reduce((sum, order) => sum + order.brand_pence, 0);
  const feePence = orders
    .filter((order) => order.status === "paid" || order.status === "shipped" || order.status === "transferred")
    .reduce((sum, order) => sum + (order.platform_fee_pence ?? 0), 0);

  return (
    <section id="sales" className="panel border hairline p-7">
      <p className="eyebrow">Sales</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em]">Where the money is</h2>
      <p className="mt-2 max-w-xl text-xs leading-5 text-[color:var(--muted)]">
        Shoppers pay Syllis at checkout. Adding tracking does not pay you. The brand share moves
        when the courier marks the parcel delivered.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="border hairline p-4">
          <p className="eyebrow">Waiting to send you</p>
          <p className="mt-2 text-3xl font-semibold">{money(heldPence)}</p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">Held until the courier marks delivered</p>
        </div>
        <div className="border hairline p-4">
          <p className="eyebrow">Sent to Express</p>
          <p className="mt-2 text-3xl font-semibold">{money(sentPence)}</p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">Then Stripe pays the brand bank</p>
        </div>
        <div className="border hairline p-4">
          <p className="eyebrow">Syllis cut</p>
          <p className="mt-2 text-3xl font-semibold">{money(feePence)}</p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">Before Stripe’s card fee</p>
        </div>
      </div>

      {orders.length === 0 && !error && (
        <p className="mt-6 text-sm text-[color:var(--muted)]">No orders yet. A paid test sale will land here.</p>
      )}
      <div className="mt-6 grid gap-3">
        {orders.map((order) => {
          const address = order.shipping?.address;
          const waiting = order.status === "paid" || order.status === "shipped";
          const overdue = order.ship_by && waiting && new Date(order.ship_by).getTime() < Date.now();
          return (
            <div key={order.id} className="border hairline p-4 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">{order.product_name}</p>
                <p className="text-xs uppercase tracking-[.12em]">{statusLabel(order)}</p>
              </div>
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                {money(order.amount_pence)} paid · brand {money(order.brand_pence)} · Syllis{" "}
                {money(order.platform_fee_pence ?? 0)}
                {order.buyer_email ? ` · ${order.buyer_email}` : ""}
              </p>
              {address && (
                <p className="mt-2 text-xs text-[color:var(--muted)]">
                  {[order.shipping?.name, address.line1, address.line2, address.city, address.postal_code, address.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              {order.tracking_number && (
                <p className="mt-2 text-xs text-[color:var(--muted)]">
                  {trackingStatusLabel(order.tracking_status)} · {order.tracking_number}
                  {order.buyer_confirmed_at ? " · shopper confirmed" : ""}
                </p>
              )}
              {overdue && (
                <p className="mt-2 text-xs text-[color:var(--muted)]">Ship-by date has passed. Add tracking.</p>
              )}
              {waiting && (
                <div className="mt-3 grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                  <select
                    className="border hairline bg-transparent px-3 py-2 text-xs"
                    value={carrier[order.id] ?? order.tracking_carrier ?? "royal-mail"}
                    onChange={(e) => setCarrier((prev) => ({ ...prev, [order.id]: e.target.value }))}
                  >
                    {CARRIERS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <input
                    className="min-w-[180px] border hairline bg-transparent px-3 py-2 text-xs"
                    placeholder="Tracking number"
                    value={tracking[order.id] ?? order.tracking_number ?? ""}
                    onChange={(e) => setTracking((prev) => ({ ...prev, [order.id]: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="button button-dark !min-h-9 !px-3 text-xs"
                    disabled={busy === order.id}
                    onClick={() => void ship(order.id)}
                  >
                    {busy === order.id ? "Checking..." : "Add tracking"}
                  </button>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                {order.track_token && (
                  <a href={`/order/${order.track_token}`} className="underline underline-offset-4">
                    Shopper tracking page
                  </a>
                )}
                {order.tracking_url && (
                  <a href={order.tracking_url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    Open courier
                  </a>
                )}
                {admin && waiting && (
                  <button
                    type="button"
                    className="underline underline-offset-4"
                    disabled={busy === order.id}
                    onClick={() => void forceRelease(order.id)}
                  >
                    Release payout now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {error && <p className="mt-3 text-xs text-[color:var(--muted)]">{error}</p>}
    </section>
  );
}
