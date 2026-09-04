"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Database,
  Megaphone,
  Package,
  Users,
  type LucideIcon,
} from "lucide-react";
import { brandPlans, userPlans } from "@/lib/data";
import { useLiveCatalogue } from "@/components/use-catalogue";

export default function DevPanel() {
  const catalogue = useLiveCatalogue();
  const products = catalogue?.products ?? [];
  const ads = catalogue?.ads ?? [];
  const [search, setSearch] = useState("");
  const [showAds, setShowAds] = useState(true);
  const [showProducts, setShowProducts] = useState(true);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.label.toLowerCase().includes(search.toLowerCase())
      ),
    [search, products]
  );

  const stats: [string, number, LucideIcon][] = [
    ["Products", products.length, Package],
    ["Brands", catalogue?.brands.length ?? 0, Users],
    ["Ad examples", ads.length, Megaphone],
    ["User plans", userPlans.length, Database],
  ];

  return (
    <div className="page-shell section-space">
      <div className="flex flex-col justify-between gap-6 border-b hairline pb-8 md:flex-row md:items-end">
        <div>
          <p className="eyebrow mb-3">Developer demo panel</p>

          <h1 className="text-[clamp(48px,7vw,88px)] font-semibold leading-[.86] tracking-[-.07em]">
            Control the demo.
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-[color:var(--muted)]">
            Control the catalogue from Admin → Catalogue. This panel just mirrors live listings.
          </p>
        </div>

        <Link
          href="/"
          className="button button-quiet"
          data-cursor="HOME"
        >
          View site <ArrowRight size={15} />
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value, Icon]) => (
          <div key={label} className="border hairline p-5">
            <Icon size={17} />

            <p className="mt-7 text-xs text-[color:var(--muted)]">
              {label}
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {String(value)}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-10 border hairline p-6 md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="eyebrow mb-2">Demo switches</p>

            <p className="text-sm text-[color:var(--muted)]">
              Quickly hide parts of the demo while building.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowAds((v) => !v)}
              className="button button-quiet !min-h-9"
              data-cursor="TOGGLE"
            >
              Ads: {showAds ? "On" : "Off"}
            </button>

            <button
              type="button"
              onClick={() => setShowProducts((v) => !v)}
              className="button button-quiet !min-h-9"
              data-cursor="TOGGLE"
            >
              Products: {showProducts ? "On" : "Off"}
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="bg-[color:var(--surface)] p-5">
            <p className="eyebrow">Starter</p>

            <p className="mt-2 text-xl font-semibold">
              £{brandPlans[0].price}/mo
            </p>

            <p className="mt-2 text-xs text-[color:var(--muted)]">
              {brandPlans[0].products} products
            </p>
          </div>

          <div className="bg-[color:var(--surface)] p-5">
            <p className="eyebrow">Growth</p>

            <p className="mt-2 text-xl font-semibold">
              £{brandPlans[1].price}/mo
            </p>

            <p className="mt-2 text-xs text-[color:var(--muted)]">
              {brandPlans[1].products} products
            </p>
          </div>

          <div className="bg-[color:var(--surface)] p-5">
            <p className="eyebrow">Premium</p>

            <p className="mt-2 text-xl font-semibold">
              £{brandPlans[2].price}/mo
            </p>

            <p className="mt-2 text-xs text-[color:var(--muted)]">
              {brandPlans[2].products} products
            </p>
          </div>
        </div>
      </section>

      {showProducts && (
        <section className="mt-10">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="eyebrow mb-2">Product data</p>

              <h2 className="text-3xl font-semibold tracking-[-.05em]">
                Mock catalogue
              </h2>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="border hairline bg-transparent px-4 py-3 text-sm outline-none md:w-72"
            />
          </div>

          <div className="mt-6 overflow-x-auto border hairline">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-[color:var(--surface)]">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Brand</th>
                  <th className="p-4">Style</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t hairline"
                  >
                    <td className="p-4 font-medium">
                      {product.name}
                    </td>

                    <td className="p-4 text-[color:var(--muted)]">
                      {product.label}
                    </td>

                    <td className="p-4">
                      {product.style}
                    </td>

                    <td className="p-4">
                      £{product.price}
                    </td>

                    <td className="p-4">
                      {product.stock ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showAds && (
        <section className="mt-10">
          <div>
            <p className="eyebrow mb-2">Advertising inventory</p>

            <h2 className="text-3xl font-semibold tracking-[-.05em]">
              Demo ad slots
            </h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="border hairline p-5"
              >
                <div className="aspect-[16/9] overflow-hidden bg-[color:var(--surface)]">
                  <img
                    src={ad.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>

                <p className="eyebrow mt-4">
                  {ad.placement}
                </p>

                <p className="mt-1 font-semibold">
                  {ad.title}
                </p>

                <p className="mt-2 text-xs text-[color:var(--muted)]">
                  {ad.days} day demo booking
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}