"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { products, styles, ads } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { AdCard } from "@/components/ad-card";

export default function DiscoverContent() {
  const params = useSearchParams();
  const initialStyle = params.get("style");

  const [style, setStyle] = useState(
    initialStyle && styles.includes(initialStyle)
      ? initialStyle
      : "All"
  );

  const [maxPrice, setMaxPrice] = useState(250);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const styleMatch = style === "All" || p.style === style;

        return styleMatch && p.price <= maxPrice;
      }),
    [style, maxPrice]
  );

  return (
    <div className="page-shell">
      <section className="border-b hairline py-14 md:py-20">
        <p className="eyebrow mb-4">Discover</p>

        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div>
            <h1 className="text-[clamp(50px,8vw,108px)] font-semibold leading-[.85] tracking-[-.075em]">
              {style === "All" ? (
                <>
                  Everything
                  <br />
                  worth finding.
                </>
              ) : (
                <>
                  {style}
                  <br />
                  edit.
                </>
              )}
            </h1>
          </div>

          <p className="max-w-sm text-sm leading-6 text-[color:var(--muted)]">
            Browse independent pieces, emerging labels and styles curated by
            Syllis.
          </p>
        </div>
      </section>

      <section className="py-8">
        <button
          type="button"
          onClick={() => setFilterOpen((value) => !value)}
          className="button button-quiet mb-8 md:hidden"
          data-cursor="FILTER"
        >
          <SlidersHorizontal size={14} />
          Filters
        </button>

        <div
          className={`mb-9 gap-6 border-b hairline pb-5 ${
            filterOpen ? "block" : "hidden"
          } md:flex md:items-center md:justify-between`}
        >
          <div className="flex flex-wrap gap-2">
            {["All", ...styles].map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setStyle(item)}
                className={`border px-3 py-2 text-[11px] transition ${
                  style === item
                    ? "border-[color:var(--text)] bg-[color:var(--text)] text-[color:var(--bg)]"
                    : "border-[color:var(--line)]"
                }`}
                data-cursor="FILTER"
              >
                {item}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-3 text-[11px] text-[color:var(--muted)]">
            Up to £{maxPrice}

            <input
              className="range"
              type="range"
              min="30"
              max="250"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs text-[color:var(--muted)]">
            {filtered.length} pieces
          </p>

          {(style !== "All" || maxPrice !== 250) && (
            <button
              type="button"
              onClick={() => {
                setStyle("All");
                setMaxPrice(250);
              }}
              className="flex items-center gap-1 text-xs"
              data-cursor="CLEAR"
            >
              Clear
              <X size={12} />
            </button>
          )}
        </div>

        {style !== "All" && (
          <div className="mb-8">
            {ads
              .filter((ad) => ad.placement === style)
              .slice(0, 1)
              .map((ad) => (
                <AdCard key={ad.id} ad={ad} compact />
              ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {!filtered.length && (
          <div className="py-32 text-center text-sm text-[color:var(--muted)]">
            Nothing here yet. Try widening your filters.
          </div>
        )}
      </section>
    </div>
  );
}