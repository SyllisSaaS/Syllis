"use client";

import { useEffect, useMemo, useState } from "react";

type Batch = {
  id: string;
  from_at: string;
  to_at: string;
  event_count: number;
  created_at: string;
  restored_at: string | null;
};

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function today() {
  return isoDate(new Date());
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  return isoDate(d);
}

function shortWhen(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminAnalyticsReset({ days, onChanged }: { days: number; onChanged: () => void }) {
  const [from, setFrom] = useState(daysAgo(days));
  const [to, setTo] = useState(today());
  const [pending, setPending] = useState<number | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [ready, setReady] = useState(true);
  const [hint, setHint] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const open = useMemo(() => batches.filter((row) => !row.restored_at), [batches]);

  async function refresh(nextFrom = from, nextTo = to) {
    const response = await fetch(
      `/api/admin/analytics-reset?from=${encodeURIComponent(nextFrom)}&to=${encodeURIComponent(nextTo)}`
    );
    const payload = (await response.json()) as {
      ready?: boolean;
      hint?: string;
      pending?: number;
      batches?: Batch[];
    };
    setReady(payload.ready !== false);
    setHint(payload.hint ?? "");
    setPending(typeof payload.pending === "number" ? payload.pending : null);
    setBatches(payload.batches ?? []);
  }

  useEffect(() => {
    const start = daysAgo(days);
    const end = today();
    setFrom(start);
    setTo(end);
    void refresh(start, end);
  }, [days]);

  function applyPreset(start: string, end: string) {
    setFrom(start);
    setTo(end);
    void refresh(start, end);
  }

  async function hideRange() {
    if (
      !window.confirm(
        `Hide ${pending ?? "these"} events from ${from} to ${to}? They leave the charts. You can restore this batch.`
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/analytics-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset", from, to }),
    });
    const payload = (await response.json()) as { error?: string; message?: string };
    setMessage(payload.error || payload.message || "Done.");
    setBusy(false);
    await refresh();
    if (response.ok) onChanged();
  }

  async function restore(batchId: string) {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/analytics-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore", batchId }),
    });
    const payload = (await response.json()) as { error?: string; message?: string };
    setMessage(payload.error || payload.message || "Restored.");
    setBusy(false);
    await refresh();
    if (response.ok) onChanged();
  }

  return (
    <div className="panel border hairline p-6">
      <p className="eyebrow">Chart reset</p>
      <h2 className="mt-2 text-xl font-semibold tracking-[-.03em]">Hide a period, then restore if you were wrong.</h2>
      <p className="mt-2 max-w-2xl text-xs leading-5 text-[color:var(--muted)]">
        This only hides views, saves, clicks and drop events. Income, accounts and the catalogue stay put.
      </p>

      {!ready && (
        <p className="mt-4 text-sm">{hint || "Paste supabase/analytics-reset.sql in Supabase, then refresh."}</p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          ["This view", daysAgo(days), today()],
          ["Today", today(), today()],
          ["7 days", daysAgo(7), today()],
          ["30 days", daysAgo(30), today()],
          ["All time", "2020-01-01", today()],
        ].map(([label, start, end]) => (
          <button
            key={label}
            type="button"
            className="button button-quiet !min-h-8 !px-3 text-xs"
            onClick={() => applyPreset(start, end)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-xs text-[color:var(--muted)]">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              void refresh(e.target.value, to);
            }}
            className="mt-1 block border hairline bg-transparent px-3 py-2 text-sm text-[color:var(--text)]"
          />
        </label>
        <label className="text-xs text-[color:var(--muted)]">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              void refresh(from, e.target.value);
            }}
            className="mt-1 block border hairline bg-transparent px-3 py-2 text-sm text-[color:var(--text)]"
          />
        </label>
        <button type="button" className="button button-dark !min-h-9 text-xs" disabled={busy || !ready} onClick={() => void hideRange()}>
          {busy ? "Working…" : `Hide ${pending ?? "…"} events`}
        </button>
      </div>

      {message && <p className="mt-4 text-sm">{message}</p>}

      {open.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold">Restore</p>
          {open.map((batch) => (
            <div key={batch.id} className="flex flex-wrap items-center justify-between gap-3 border hairline px-4 py-3 text-sm">
              <p>
                {batch.event_count} events · {shortWhen(batch.from_at)} – {shortWhen(batch.to_at)}
              </p>
              <button
                type="button"
                className="button button-quiet !min-h-8 !px-3 text-xs"
                disabled={busy}
                onClick={() => void restore(batch.id)}
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
