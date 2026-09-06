"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { T } from "@/lib/tables";
import { trackEvent } from "@/lib/track";

export function ProductCard({ product }: { product: Product }) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function checkSaved() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from(T.savedItems)
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();

      setSaved(Boolean(data));
      setLoading(false);
    }

    checkSaved();
  }, [product.id]);

  async function toggleSaved() {
    if (saving) return;

    if (!isSupabaseConfigured()) {
      window.location.href = "/login";
      return;
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setSaving(true);

    try {
      if (saved) {
        const { error } = await supabase
          .from(T.savedItems)
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product.id);

        if (!error) {
          setSaved(false);
        } else {
          console.error("Failed to unsave product:", error);
        }
      } else {
        const { error } = await supabase.from(T.savedItems).insert({
          user_id: user.id,
          product_id: product.id,
        });

        if (!error) {
          setSaved(true);
          trackEvent("product_save", {
            productId: product.id,
            brandSlug: product.label
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, ""),
          });
        } else {
          console.error("Failed to save product:", error);
        }
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="product-card group">
      <Link
        href={`/product/${product.slug}`}
        data-cursor="VIEW"
        className="block"
      >
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
        <button
          type="button"
          onClick={toggleSaved}
          disabled={loading || saving}
          data-cursor={saved ? "SAVED" : "SAVE"}
          aria-label={saved ? "Remove from saved" : "Save product"}
          className="save-button absolute right-0 top-2 grid size-9 place-items-center transition disabled:opacity-50"
        >
          <Heart
            size={16}
            strokeWidth={1.5}
            fill={saved ? "currentColor" : "none"}
          />
        </button>

        <p className="eyebrow mb-1">{product.label}</p>

        <Link
          href={`/product/${product.slug}`}
          className="block pr-9 text-[13px] font-semibold leading-5"
        >
          {product.name}
        </Link>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-[13px]">
            £{product.price}
          </span>

          <span className="text-[11px] text-[color:var(--muted)]">
            {product.style} · {product.category}
          </span>
        </div>
      </div>
    </article>
  );
}