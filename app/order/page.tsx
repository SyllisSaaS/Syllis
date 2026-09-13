"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trackingStatusLabel } from "@/lib/tracking";

type ListedOrder = {
  id: string;
  product_name: string;
  status: string;
  tracking_status: string | null;
  token: string | null;
  created_at: string;
};

export default function FindOrderPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState<ListedOrder[] | null>(null);

  useEffect(() => {
    void fetch("/api/account/orders")
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { orders?: ListedOrder[] };
        setMine(data.orders ?? []);
      })
      .catch(() => undefined);
  }, []);

  async function find(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/orders/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, orderId }),
    });
    const data = (await res.json()) as { token?: string; error?: string };
    setBusy(false);
    if (!res.ok || !data.token) {
      setError(data.error || "Could not find that order.");
      return;
    }
    router.push(`/order/${data.token}`);
  }

  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-4">Orders</p>
      <h1 className="text-5xl font-semibold tracking-[-.06em]">Track a piece.</h1>
      <p className="mt-4 max-w-md text-sm text-[color:var(--muted)]">
        Use the email from checkout and the order id from your Stripe receipt. Logged-in shoppers
        also see orders on this page.
      </p>

      <form onSubmit={(e) => void find(e)} className="mt-8 grid max-w-md gap-3">
        <input
          className="border hairline bg-transparent px-3 py-3 text-sm"
          type="email"
          placeholder="Checkout email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="border hairline bg-transparent px-3 py-3 text-sm"
          placeholder="Order id"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          required
        />
        <button type="submit" className="button button-dark" disabled={busy}>
          {busy ? "Looking..." : "Find order"}
        </button>
        {error && <p className="text-xs text-[color:var(--muted)]">{error}</p>}
      </form>

      {mine && mine.length > 0 && (
        <div className="mt-12 grid max-w-xl gap-3">
          <p className="eyebrow">Your orders</p>
          {mine.map((order) => (
            <Link key={order.id} href={order.token ? `/order/${order.token}` : "/order"} className="border hairline p-4">
              <p className="font-semibold">{order.product_name}</p>
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                {trackingStatusLabel(order.tracking_status)} · {new Date(order.created_at).toLocaleDateString("en-GB")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
