"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { useLiveCatalogue } from "@/components/use-catalogue";

export default function SearchPage() {
  const catalogue = useLiveCatalogue();
  const products = catalogue?.products ?? [];
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => `${p.name} ${p.label} ${p.style} ${p.category}`.toLowerCase().includes(q));
  }, [query, products]);

  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-4">Search</p>
      <h1 className="text-5xl font-semibold tracking-[-.06em]">Find a piece.</h1>
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search brands, styles, products..."
        className="mt-8 w-full border hairline bg-transparent px-4 py-4 text-sm outline-none"
      />
      <p className="mt-6 text-xs text-[color:var(--muted)]">
        {catalogue ? `${results.length} results` : "Loading…"}
      </p>
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">
        {results.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
