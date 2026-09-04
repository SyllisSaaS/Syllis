"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";

export type Hold = {
  id: string;
  dropId: string;
  productSlug: string;
  name: string;
  label: string;
  image: string;
  pool: "early" | "public";
  size: string | null;
  expiresAt: string;
};

function remainingLabel(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  return minutes === 1 ? "1 min left" : `${minutes} min left`;
}

export function ReservedCard({
  hold,
  onReleased,
}: {
  hold: Hold;
  onReleased?: () => void;
}) {
  const [label, setLabel] = useState(remainingLabel(hold.expiresAt));
  const [busy, setBusy] = useState(false);
  const expired = label === "Expired";

  useEffect(() => {
    const tick = () => setLabel(remainingLabel(hold.expiresAt));
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, [hold.expiresAt]);

  async function release() {
    setBusy(true);
    const response = await fetch("/api/reserves", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdId: hold.id }),
    });
    setBusy(false);
    if (response.ok) onReleased?.();
  }

  return (
    <article className={`reserved-card overflow-hidden ${expired ? "opacity-50" : ""}`}>
      <Link href={`/product/${hold.productSlug}`} className="block" data-cursor="VIEW">
        <div className="relative aspect-[4/5] overflow-hidden bg-[color:var(--surface)]">
          <img src={hold.image} alt="" className="h-full w-full object-cover" />
          <span className="ad-badge absolute left-3 top-3 px-2 py-1 font-mono text-[9px] uppercase tracking-[.12em] text-black">
            Reserved
          </span>
        </div>
      </Link>
      <div className="py-3">
        <p className="eyebrow mb-1">{hold.label}</p>
        <Link href={`/product/${hold.productSlug}`} className="block text-[13px] font-semibold leading-5">
          {hold.name}
        </Link>
        <p className="mt-2 flex items-center gap-1.5 text-[12px]">
          <Clock size={12} />
          {expired ? "Hold ended" : `${label} · ${hold.pool} pool`}
        </p>
        {!expired && (
          <>
            <p className="mt-1 text-[11px] text-[color:var(--muted)]">
              Buy on the brand site before this runs out. {hold.size ? `Size ${hold.size}.` : ""}
            </p>
            <button
              type="button"
              className="mt-3 text-[11px] underline underline-offset-4"
              disabled={busy}
              onClick={() => void release()}
            >
              {busy ? "Releasing…" : "Drop this hold"}
            </button>
          </>
        )}
      </div>
    </article>
  );
}
