"use client";

import { useEffect, useState } from "react";

export function StudioPayouts({ takeRate: initialTake }: { takeRate: number }) {
  const [takeRate, setTakeRate] = useState(initialTake);
  const [payoutsReady, setPayoutsReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/studio/connect");
    const data = (await res.json()) as {
      takeRate?: number;
      payoutsReady?: boolean;
      connected?: boolean;
      error?: string;
      needsSql?: boolean;
    };
    if (!res.ok) {
      setError(data.error || "Could not load payouts.");
      return;
    }
    setTakeRate(data.takeRate ?? 0.1);
    setPayoutsReady(Boolean(data.payoutsReady));
    setConnected(Boolean(data.connected));
    setError("");
  }

  useEffect(() => {
    void load();
    if (new URLSearchParams(window.location.search).get("connect") === "refresh") {
      void start();
    }
    // start is recreated each render; only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/studio/connect", { method: "POST" });
    const data = (await res.json()) as { url?: string; ready?: boolean; error?: string };
    setBusy(false);
    if (!res.ok || !data.url) {
      setError(data.error || "Could not open Stripe.");
      return;
    }
    window.location.href = data.url;
  }

  const percent = Math.round(takeRate * 100);

  return (
    <section className="panel border hairline p-7">
      <p className="eyebrow">Payouts</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em]">Get paid when you ship</h2>
      <p className="mt-2 max-w-xl text-xs leading-5 text-[color:var(--muted)]">
        Shoppers check out on Syllis. Money is held until you add tracking. Syllis keeps {percent}% on
        this plan; the rest goes to your Stripe. You never paste a secret key.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" className="button button-dark" disabled={busy} onClick={() => void start()}>
          {busy ? "Opening Stripe..." : payoutsReady ? "Open payouts" : connected ? "Finish payout setup" : "Set up payouts"}
        </button>
        <p className="text-xs text-[color:var(--muted)]">
          {payoutsReady ? "Ready to sell on Syllis." : "Buy buttons stay off until Stripe verifies you."}
        </p>
      </div>
      {error && <p className="mt-3 text-xs text-[color:var(--muted)]">{error}</p>}
    </section>
  );
}
