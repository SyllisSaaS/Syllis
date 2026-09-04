"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { adsForPlacement, isStyleName, styles, type Ad, type Brand, type Product, type StyleName } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { AdCard } from "@/components/ad-card";

export default function DiscoverContent({
  products,
  ads,
  brands,
}: {
  products: Product[];
  ads: Ad[];
  brands: Brand[];
}) {
  const params = useSearchParams();
  const initialStyle = params.get("style");

  const [style, setStyle] = useState<"All" | StyleName>(
    initialStyle && isStyleName(initialStyle) ? initialStyle : "All"
  );

  const [maxPrice, setMaxPrice] = useState(250);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const styleMatch = style === "All" || p.style === style;
        return styleMatch && p.price <= maxPrice;
      }),
    [style, maxPrice, products]
  );

  const placedAds = adsForPlacement(ads, style === "All" ? "All" : style);

  return (
    <div className="page-shell">
      <section className="border-b hairline py-14 md:py-20">
        <p className="eyebrow mb-4">
          {style === "All" ? "Discover / All Syllis" : `Discover / ${style} niche`}
        </p>

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
                  niche.
                </>
              )}
            </h1>
          </div>

          <p className="max-w-sm text-sm leading-6 text-[color:var(--muted)]">
            {style === "All"
              ? "Every niche in one feed. Premium sponsored slots sit at the top."
              : `Pieces tagged ${style}. Niche ads are cheaper than All Syllis, and only show here.`}
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
          <div>
            <p className="eyebrow mb-3">Niches</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStyle("All")}
                className={`border px-3 py-2 text-[11px] transition ${
                  style === "All"
                    ? "border-[color:var(--text)] bg-[color:var(--text)] text-[color:var(--bg)]"
                    : "border-[color:var(--line)]"
                }`}
                data-cursor="FILTER"
              >
                All Syllis
              </button>
              {styles.map((item) => (
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
            {style === "All" ? `${filtered.length} pieces across all niches` : `${filtered.length} pieces in ${style}`}
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

        {placedAds.length > 0 && (
          <div className={`mb-10 ${placedAds.length > 1 ? "grid gap-4 md:grid-cols-3" : ""}`}>
            {placedAds.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                products={products}
                brands={brands}
                compact={style !== "All" || placedAds.length > 1}
              />
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
