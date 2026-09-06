"use client";

import { useState } from "react";
import { brandPlans, type BrandPlan } from "@/lib/plans";

export function StudioPlan({ current }: { current: string }) {
  const [plan, setPlan] = useState(current);
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  async function choose(next: BrandPlan) {
    setBusy(true);
    setSaved("");
    const res = await fetch("/api/account/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: next }),
    });
    setBusy(false);
    if (!res.ok) {
      setSaved("Could not update the plan.");
      return;
    }
    setPlan(next);
    setSaved(`${next} tools are on. Refresh to see analytics change.`);
    window.location.reload();
  }

  return (
    <section className="panel border hairline p-7">
      <p className="eyebrow">Plan</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em]">What this account can use</h2>
      <p className="mt-2 max-w-xl text-xs leading-5 text-[color:var(--muted)]">
        Billing is paused, so pick the toolset you want to try. Premium unlocks the full analytics
        builder. Nothing will be charged.
      </p>
      <div className="mt-6 grid gap-2">
        {brandPlans.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={busy}
            onClick={() => void choose(item.id)}
            className={`flex items-center justify-between border px-4 py-3 text-left text-sm ${
              plan === item.id ? "border-[color:var(--text)]" : "hairline"
            }`}
          >
            <span>
              <span className="font-semibold">{item.name}</span>
              <span className="ml-2 text-xs text-[color:var(--muted)]">{item.features[0]}</span>
            </span>
            {plan === item.id && <span className="text-[10px] uppercase tracking-[.12em]">Current</span>}
          </button>
        ))}
      </div>
      {saved && <p className="mt-3 text-xs text-[color:var(--muted)]">{saved}</p>}
    </section>
  );
}
