"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/data";

export function ProductCard({ product }: { product: Product }) {
  const [saved, setSaved] = useState(false);

  return (
    <article className="product-card group">
      <Link href={`/product/${product.slug}`} data-cursor="VIEW" className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[color:var(--surface)]">
          <img src={product.image} alt={product.name} className="product-image h-full w-full object-cover" />
          {product.badge && (
            <span className="absolute left-3 top-3 bg-[color:var(--bg)] px-2 py-1 font-mono text-[9px] uppercase tracking-[.12em]">
              {product.badge}
            </span>
          )}
        </div>
      </Link>

      <div className="relative py-3">
        <button
          type="button"
          onClick={() => setSaved((value) => !value)}
          data-cursor={saved ? "SAVED" : "SAVE"}
          aria-label={saved ? "Remove from saved" : "Save product"}
          className="save-button absolute right-0 top-2 grid size-9 place-items-center transition"
        >
          <Heart size={16} strokeWidth={1.5} fill={saved ? "currentColor" : "none"} />
        </button>

        <p className="eyebrow mb-1">{product.label}</p>
        <Link href={`/product/${product.slug}`} className="block pr-9 text-[13px] font-semibold leading-5">
          {product.name}
        </Link>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-[13px]">£{product.price}</span>
          <span className="text-[11px] text-[color:var(--muted)]">{product.category}</span>
        </div>
      </div>
    </article>
  );
}
