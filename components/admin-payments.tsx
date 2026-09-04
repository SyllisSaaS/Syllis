"use client";

import { useEffect, useState } from "react";
import { placementOptions } from "@/lib/ads";

type Prices = Partial<Record<"early" | "starter" | "growth" | "premium", string>>;
type Booking = {
  id: string;
  placement: string;
  days: number;
  amount_pence: number;
  renewals: number;
  title: string;
  brand: string;
  status: string;
  created_at: string;
};
type LedgerRow = {
  id: string;
  source: string;
  amount_pence: number;
  description: string | null;
  occurred_at: string;
};

function money(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

export function AdminPayments() {
  const [stripe, setStripe] = useState(false);
  const [webhook, setWebhook] = useState(false);
  const [prices, setPrices] = useState<Prices>({});
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [placement, setPlacement] = useState("All");
  const [days, setDays] = useState(3);

  async function load() {
    const response = await fetch("/api/admin/payments");
    const payload = (await response.json()) as {
      stripe?: boolean;
      webhook?: boolean;
      prices?: Prices;
      bookings?: Booking[];
      ledger?: LedgerRow[];
      error?: string;
    };
    setStripe(Boolean(payload.stripe));
    setWebhook(Boolean(payload.webhook));
    setPrices(payload.prices ?? {});
    setBookings(payload.bookings ?? []);
    setLedger(payload.ledger ?? []);
    if (payload.error) setMessage(payload.error);
  }

  useEffect(() => {
    void load();
  }, []);

  async function ensure() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ensure-catalog" }),
    });
    const payload = (await response.json()) as { error?: string; message?: string };
    setMessage(payload.error || payload.message || "Done.");
    setBusy(false);
    await load();
  }

  async function comp() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "comp-ad", title, placement, days }),
    });
    const payload = (await response.json()) as { error?: string; message?: string };
    setMessage(payload.error || payload.message || "Done.");
    setBusy(false);
    await load();
  }

  return (
    <div className="grid gap-6">
      <div className="panel border hairline p-6">
        <p className="eyebrow">Stripe</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-.03em]">Coordinate payments here.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
          Subscriptions and ad slots check out on Syllis. This desk shows whether Stripe is wired,
          creates the four monthly products, and lists ad bookings. Income lands on Overview.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <p className="text-sm">Secret key: {stripe ? "set" : "missing"}</p>
          <p className="text-sm">Webhook secret: {webhook ? "set" : "missing"}</p>
        </div>
        <div className="mt-4 grid gap-2 text-xs text-[color:var(--muted)] md:grid-cols-2">
          {(["early", "starter", "growth", "premium"] as const).map((plan) => (
            <p key={plan}>
              {plan}: {prices[plan] ? prices[plan] : "not created yet"}
            </p>
          ))}
        </div>
        <button type="button" className="button button-dark mt-6" disabled={busy || !stripe} onClick={() => void ensure()}>
          {busy ? "Working…" : "Create Syllis products in Stripe"}
        </button>
        {!stripe && (
          <p className="mt-3 text-xs text-[color:var(--muted)]">
            Add STRIPE_SECRET_KEY (prefer a restricted key) to .env.local. Point a webhook at
            /api/stripe/webhook for checkout.session.completed, customer.subscription.*, and
            invoice.paid.
          </p>
        )}
      </div>

      <div className="panel border hairline p-6">
        <p className="text-xs font-semibold">Comp an ad slot</p>
        <p className="mt-1 text-xs text-[color:var(--muted)]">No charge. Use this for tests. Paste supabase/payments.sql first.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ad title"
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
          <button type="button" className="button button-quiet" disabled={busy} onClick={() => void comp()}>
            Put on without paying
          </button>
        </div>
      </div>

      {message && <p className="text-sm">{message}</p>}

      <div className="panel overflow-x-auto border hairline">
        <p className="p-4 text-xs font-semibold">Ad bookings</p>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[.12em] text-[color:var(--muted)]">
            <tr>
              <th className="px-4 pb-3">Title</th>
              <th className="px-4 pb-3">Slot</th>
              <th className="px-4 pb-3">Paid</th>
              <th className="px-4 pb-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-[color:var(--muted)]" colSpan={4}>
                  None yet.
                </td>
              </tr>
            ) : (
              bookings.map((row) => (
                <tr key={row.id} className="border-t hairline">
                  <td className="px-4 py-3">
                    {row.title}
                    <span className="block text-xs text-[color:var(--muted)]">{row.brand}</span>
                  </td>
                  <td className="px-4 py-3">
                    {row.placement} · {row.days}d · renew {row.renewals}
                  </td>
                  <td className="px-4 py-3">{money(row.amount_pence)}</td>
                  <td className="px-4 py-3">{row.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="panel overflow-x-auto border hairline">
        <p className="p-4 text-xs font-semibold">Latest ledger</p>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[.12em] text-[color:var(--muted)]">
            <tr>
              <th className="px-4 pb-3">When</th>
              <th className="px-4 pb-3">Source</th>
              <th className="px-4 pb-3">Amount</th>
              <th className="px-4 pb-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {ledger.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-[color:var(--muted)]" colSpan={4}>
                  Empty until a payment lands.
                </td>
              </tr>
            ) : (
              ledger.map((row) => (
                <tr key={row.id} className="border-t hairline">
                  <td className="px-4 py-3">{new Date(row.occurred_at).toLocaleString("en-GB")}</td>
                  <td className="px-4 py-3">{row.source}</td>
                  <td className="px-4 py-3">{money(row.amount_pence)}</td>
                  <td className="px-4 py-3">{row.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
