"use client";

import Link from "next/link";
import type { Product } from "@/lib/data";
import { SaveButton } from "@/components/save-button";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card group">
      <Link href={`/product/${product.slug}`} data-cursor="VIEW" className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[color:var(--surface)]">
          <img
            src={product.image}
            alt={product.name}
            className="product-image h-full w-full object-cover"
            style={{ objectPosition: `${product.imageX ?? 50}% ${product.imageY ?? 50}%` }}
            loading="lazy"
            decoding="async"
          />

          {product.badge && (
            <span className="absolute left-3 top-3 bg-[color:var(--bg)] px-2 py-1 font-mono text-[9px] uppercase tracking-[.12em]">
              {product.badge}
            </span>
          )}
        </div>
      </Link>

      <div className="relative py-3">
        <SaveButton product={product} className="absolute right-0 top-2" />

        <p className="eyebrow mb-1">{product.label}</p>

        <Link href={`/product/${product.slug}`} className="block pr-9 text-[13px] font-semibold leading-5">
          {product.name}
        </Link>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-[13px]">£{product.price}</span>

          <span className="text-[11px] text-[color:var(--muted)]">
            {product.style} · {product.category}
          </span>
        </div>
      </div>
    </article>
  );
}
