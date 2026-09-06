"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  product_name: string;
  buyer_email: string | null;
  amount_pence: number;
  brand_pence: number;
  status: string;
  tracking_number: string | null;
  created_at: string;
  shipping: { name?: string | null; address?: Record<string, string | null> | null } | null;
};

function money(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

export function StudioOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/studio/orders");
    const data = (await res.json()) as { orders?: Order[]; error?: string };
    if (!res.ok) {
      setError(data.error || "Could not load orders.");
      return;
    }
    setOrders(data.orders ?? []);
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
      body: JSON.stringify({ orderId, trackingNumber: tracking[orderId] ?? "" }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(null);
    if (!res.ok) {
      setError(data.error || "Could not release that order.");
      return;
    }
    await load();
  }

  return (
    <section className="panel border hairline p-7">
      <p className="eyebrow">Sales</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em]">Orders log themselves</h2>
      <p className="mt-2 max-w-xl text-xs leading-5 text-[color:var(--muted)]">
        Paid orders wait here. Add tracking and we send the brand share to your Stripe. No spreadsheet.
      </p>
      {orders.length === 0 && !error && (
        <p className="mt-6 text-sm text-[color:var(--muted)]">No orders yet.</p>
      )}
      <div className="mt-6 grid gap-3">
        {orders.map((order) => {
          const address = order.shipping?.address;
          const waiting = order.status === "paid" || order.status === "shipped";
          return (
            <div key={order.id} className="border hairline p-4 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">{order.product_name}</p>
                <p className="text-xs uppercase tracking-[.12em]">{order.status}</p>
              </div>
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                {money(order.amount_pence)} paid · you get {money(order.brand_pence)} after ship
                {order.buyer_email ? ` · ${order.buyer_email}` : ""}
              </p>
              {address && (
                <p className="mt-2 text-xs text-[color:var(--muted)]">
                  {[order.shipping?.name, address.line1, address.line2, address.city, address.postal_code, address.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              {waiting && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    className="min-w-[180px] flex-1 border hairline bg-transparent px-3 py-2 text-xs"
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
                    {busy === order.id ? "Releasing..." : "Mark shipped + pay me"}
                  </button>
                </div>
              )}
              {order.tracking_number && !waiting && (
                <p className="mt-2 text-xs text-[color:var(--muted)]">Tracking {order.tracking_number}</p>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="mt-3 text-xs text-[color:var(--muted)]">{error}</p>}
    </section>
  );
}
