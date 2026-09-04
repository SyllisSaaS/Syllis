"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { useLiveCatalogue } from "@/components/use-catalogue";
import { ProductCard } from "@/components/product-card";
import { ReservedCard, type Hold } from "@/components/reserved-card";
import { T } from "@/lib/tables";

type SavedRow = {
  product_id: string;
};

export default function SavedPage() {
  const catalogue = useLiveCatalogue();
  const [savedProducts, setSavedProducts] = useState<import("@/lib/data").Product[]>([]);
  const [holds, setHolds] = useState<Hold[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      setLoggedIn(true);
      if (!catalogue) return;

      const [{ data, error }, holdsRes] = await Promise.all([
        supabase.from(T.savedItems).select("product_id").eq("user_id", user.id),
        fetch("/api/reserves"),
      ]);

      if (error) {
        console.error("Error loading saved products:", error);
      }

      const ids = ((data ?? []) as SavedRow[]).map((row) => row.product_id);
      setSavedProducts((catalogue.products ?? []).filter((product) => ids.includes(product.id)));

      if (holdsRes.ok) {
        const payload = (await holdsRes.json()) as { holds?: Hold[] };
        setHolds(payload.holds ?? []);
      }

      setLoading(false);
    }

    void load();
  }, [catalogue]);

  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-4">Saved</p>
      <h1 className="text-5xl font-semibold tracking-[-.06em]">Your finds.</h1>
      <p className="mt-4 max-w-xl text-sm text-[color:var(--muted)]">
        Saved pieces stay here. Drop holds are separate — they only last 30 minutes.
      </p>

      {!loggedIn && !loading && (
        <div className="mt-10 border hairline p-8">
          <p className="text-sm">Log in to see saved pieces and drop holds.</p>
          <Link href="/login" className="button button-dark mt-6 inline-flex">
            Log in
          </Link>
        </div>
      )}

      {loading && <p className="mt-10 text-sm text-[color:var(--muted)]">Loading…</p>}

      {!loading && loggedIn && (
        <>
          <section id="reserved" className="mt-12 scroll-mt-24">
            <div className="mb-6 flex items-end justify-between gap-6 border-b hairline pb-4">
              <div>
                <p className="eyebrow">Reserved</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em]">Drop holds</h2>
                <p className="mt-2 max-w-md text-xs leading-5 text-[color:var(--muted)]">
                  A reserve is a timed hold, not a purchase. Finish with the brand before the timer ends.
                </p>
              </div>
              <Link href="/drops" className="hidden text-xs underline underline-offset-4 md:inline">
                Open drops
              </Link>
            </div>

            {holds.length === 0 ? (
              <div className="border hairline p-6 text-sm text-[color:var(--muted)]">
                No active holds. Reserve from{" "}
                <Link href="/drops" className="underline underline-offset-4">
                  Drops
                </Link>{" "}
                when a window is open.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">
                {holds.map((hold) => (
                  <ReservedCard
                    key={hold.id}
                    hold={hold}
                    onReleased={() => setHolds((rows) => rows.filter((row) => row.id !== hold.id))}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="mt-16">
            <div className="mb-6 border-b hairline pb-4">
              <p className="eyebrow">Saved</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em]">Pieces you kept</h2>
            </div>

            {savedProducts.length === 0 ? (
              <div className="border hairline p-6 text-sm text-[color:var(--muted)]">
                Nothing saved yet. Heart a piece on Discover.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">
                {savedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
