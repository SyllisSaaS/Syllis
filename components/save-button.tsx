"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { T } from "@/lib/tables";
import { trackEvent } from "@/lib/track";

export function SaveButton({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
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

    void checkSaved();
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

        if (!error) setSaved(false);
        else console.error("Failed to unsave product:", error);
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
    <button
      type="button"
      onClick={toggleSaved}
      disabled={loading || saving}
      data-cursor={saved ? "SAVED" : "SAVE"}
      aria-label={saved ? "Remove from saved" : "Save product"}
      className={`save-button grid size-9 place-items-center transition disabled:opacity-50 ${className}`}
    >
      <Heart size={16} strokeWidth={1.5} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
