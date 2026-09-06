import { APPEARANCE_SQL_HINT, DEFAULT_BANNER, isMissingColumn } from "@/lib/appearance";
import { slugify } from "@/lib/data";
import type { Profile } from "@/lib/profile";
import { T } from "@/lib/tables";
import type { SupabaseClient } from "@supabase/supabase-js";

export function studioSlug(profile: Profile) {
  return profile.brand_slug || slugify(profile.full_name || profile.name || "brand") || `brand-${profile.id.slice(0, 8)}`;
}

export async function ensureStudioBrand(supabase: SupabaseClient, profile: Profile) {
  const slug = studioSlug(profile);
  const name = profile.full_name || profile.name || "Your label";

  const existing = await supabase.from(T.brands).select("*").eq("slug", slug).maybeSingle();
  if (existing.error && isMissingTable(existing.error)) {
    return { brand: null, error: "Catalogue tables are missing. Paste supabase/schema.sql first.", needsSql: true };
  }
  if (existing.data) {
    if (!existing.data.owner_id) {
      await supabase.from(T.brands).update({ owner_id: profile.id }).eq("id", existing.data.id);
    }
    return { brand: existing.data as Record<string, unknown>, error: null, needsSql: false };
  }

  const row = {
    id: slug,
    slug,
    name,
    niche: "Minimal",
    location: "",
    description: "",
    image: "",
    featured: false,
    live: true,
    source: "real",
    owner_id: profile.id,
    banner_mode: "color",
    banner_color: DEFAULT_BANNER,
  };

  const inserted = await supabase.from(T.brands).insert(row).select("*").maybeSingle();
  if (inserted.error) {
    if (isMissingColumn(inserted.error)) {
      const fallback = { ...row };
      delete (fallback as { owner_id?: string }).owner_id;
      delete (fallback as { banner_mode?: string }).banner_mode;
      delete (fallback as { banner_color?: string }).banner_color;
      const retry = await supabase.from(T.brands).insert(fallback).select("*").maybeSingle();
      if (retry.data) return { brand: retry.data as Record<string, unknown>, error: null, needsSql: true };
      return { brand: null, error: APPEARANCE_SQL_HINT, needsSql: true };
    }
    return { brand: null, error: inserted.error.message, needsSql: false };
  }

  if (!profile.brand_slug) {
    await supabase.from(T.profiles).update({ brand_slug: slug }).eq("id", profile.id);
  }

  return { brand: (inserted.data ?? row) as Record<string, unknown>, error: null, needsSql: false };
}

function isMissingTable(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const message = (error.message || "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    message.includes("does not exist") ||
    message.includes("could not find the table")
  );
}
