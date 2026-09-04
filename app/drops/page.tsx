"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { CheckoutButton } from "@/components/checkout-button";
import { Track } from "@/components/track";
import type { Drop, DropStatus } from "@/lib/drops";
import type { Ad } from "@/lib/data";
import { AdCard } from "@/components/ad-card";

type Stock = {
  earlyCap: number;
  publicCap: number;
  earlyRemaining: number;
  publicRemaining: number;
};

type DropPayload = Drop & {
  productSlug: string;
  status: DropStatus;
  stock: Stock | null;
  canSeeEarly: boolean;
  heldUntil: string | null;
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DropsPage() {
  const [drops, setDrops] = useState<DropPayload[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [early, setEarly] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/drops");
    const payload = (await response.json()) as { drops: DropPayload[]; early: boolean; ads?: Ad[] };
    setDrops(payload.drops);
    setEarly(payload.early);
    setAds(payload.ads ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function reserve(dropId: string) {
    setBusy(dropId);
    setMessage("");
    const response = await fetch("/api/reserves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dropId, size: "M" }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error || "Could not reserve.");
    } else {
      setMessage("Hold placed for 30 minutes. Find it in Saved → Reserved.");
      await load();
    }
    setBusy(null);
  }

  async function release(dropId: string) {
    setBusy(dropId);
    setMessage("");
    const response = await fetch("/api/reserves", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dropId }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error || "Could not drop the hold.");
    } else {
      setMessage("Hold released. That unit is free again.");
      await load();
    }
    setBusy(null);
  }

  const upcoming = useMemo(
    () => drops.filter((drop) => drop.status !== "ended"),
    [drops]
  );

  return (
    <div className="page-shell section-space">
      <Track name="page_view" />
      <p className="eyebrow mb-4">Limited drops</p>
      <h1 className="max-w-4xl text-[clamp(48px,8vw,104px)] font-semibold leading-[.86] tracking-[-.07em]">
        Early stock is capped.
      </h1>
      <p className="mt-6 max-w-xl text-sm leading-6 text-[color:var(--muted)]">
        Early members can reserve up to 20% of each drop before it goes public. The rest stays
        available for everyone. Holds expire after 30 minutes.
      </p>

      {!early && (
        <div className="panel mt-8 max-w-xl border hairline p-6">
          <p className="text-sm font-semibold">Free members see public windows.</p>
          <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">
            Upgrade to Early for a 7-day trial, then £4/month.
          </p>
          <CheckoutButton plan="early" className="button button-dark mt-5">
            Try Early <ArrowRight size={14} />
          </CheckoutButton>
        </div>
      )}

      {message && <p className="mt-6 text-sm">{message}</p>}

      {ads.length > 0 && (
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} compact />
          ))}
        </div>
      )}

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {upcoming.map((drop) => {
          const locked = drop.status === "early" && !drop.canSeeEarly;
          const remaining =
            drop.status === "early"
              ? drop.stock?.earlyRemaining
              : drop.stock?.publicRemaining;
          const held = Boolean(drop.heldUntil);

          return (
            <article key={drop.id} className="panel border hairline overflow-hidden">
              <div className="relative aspect-[16/10] bg-[color:var(--surface)]">
                <img
                  src={drop.image}
                  alt=""
                  className={`h-full w-full object-cover ${locked ? "blur-md scale-105" : ""}`}
                />
                {held && (
                  <span className="ad-badge absolute left-3 top-3 px-2 py-1 font-mono text-[9px] uppercase tracking-[.12em] text-black">
                    Your hold
                  </span>
                )}
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                    <p className="flex items-center gap-2 text-xs uppercase tracking-[.14em]">
                      <Lock size={14} /> Unlocks {formatWhen(drop.publicOpensAt)}
                    </p>
                  </div>
                )}
              </div>
              <div className="p-6">
                <p className="eyebrow">{drop.label}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em]">{drop.name}</h2>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  {drop.status === "early"
                    ? `Early window · public ${formatWhen(drop.publicOpensAt)}`
                    : `Public now · ends ${formatWhen(drop.endsAt)}`}
                </p>
                {held ? (
                  <p className="mt-4 text-xs">
                    Reserved until {formatWhen(drop.heldUntil!)}. A hold is not a purchase.
                  </p>
                ) : (
                  <p className="mt-4 text-xs text-[color:var(--muted)]">
                    {drop.status === "early"
                      ? `${drop.stock?.earlyRemaining ?? 0} of ${drop.stock?.earlyCap ?? 0} early units left`
                      : `${remaining ?? 0} public units left`}
                  </p>
                )}
                <div className="mt-6 flex flex-wrap gap-3">
                  {locked ? (
                    <Link href="/pricing" className="button button-quiet">
                      Unlock Early
                    </Link>
                  ) : held ? (
                    <>
                      <button
                        type="button"
                        className="button button-quiet"
                        disabled={busy === drop.id}
                        onClick={() => release(drop.id)}
                      >
                        {busy === drop.id ? "Releasing..." : "Drop hold"}
                      </button>
                      <Link href="/saved#reserved" className="button button-dark">
                        View in Saved
                      </Link>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="button button-dark"
                      disabled={busy === drop.id || remaining === 0}
                      onClick={() => reserve(drop.id)}
                    >
                      {remaining === 0 ? "Sold through" : busy === drop.id ? "Holding..." : "Reserve"}
                    </button>
                  )}
                  <Link href={`/product/${drop.productSlug}`} className="button button-quiet">
                    View piece
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
