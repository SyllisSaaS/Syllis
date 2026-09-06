import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { APPEARANCE_SQL_HINT, clampFocus, isMissingColumn } from "@/lib/appearance";
import { isStyleName, slugify, styles } from "@/lib/data";
import { profileEntitlements } from "@/lib/profile";
import { ensureStudioBrand } from "@/lib/studio";
import { T } from "@/lib/tables";
import { createServiceClient } from "@/lib/supabase/service";

function canStudio(profile: NonNullable<Awaited<ReturnType<typeof getProfile>>>) {
  return profile.role === "brand" || profile.role === "admin";
}

export async function GET() {
  const profile = await getProfile();
  if (!profile || !canStudio(profile)) return NextResponse.json({ error: "Brand accounts only." }, { status: 403 });

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Service role is required." }, { status: 503 });

  const ensured = await ensureStudioBrand(supabase, profile);
  if (!ensured.brand) return NextResponse.json({ error: ensured.error, needsSql: ensured.needsSql }, { status: 400 });

  const slug = String(ensured.brand.slug);
  const { data, error } = await supabase
    .from(T.products)
    .select("*")
    .or(`brand_slug.eq.${slug},brand_id.eq.${ensured.brand.id}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const access = profileEntitlements(profile);
  return NextResponse.json({
    products: data ?? [],
    cap: access.entitlements.productCap,
    readOnly: access.readOnly,
    styles,
    brand: ensured.brand,
  });
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || !canStudio(profile)) return NextResponse.json({ error: "Brand accounts only." }, { status: 403 });

  const access = profileEntitlements(profile);
  if (access.readOnly) return NextResponse.json({ error: "Your plan is read-only until billing is resumed." }, { status: 403 });

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Service role is required." }, { status: 503 });

  const ensured = await ensureStudioBrand(supabase, profile);
  if (!ensured.brand) return NextResponse.json({ error: ensured.error, needsSql: ensured.needsSql }, { status: 400 });

  const body = (await request.json()) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  if (!name) return NextResponse.json({ error: "Give the piece a name." }, { status: 400 });

  const slug = String(ensured.brand.slug);
  const { count } = await supabase
    .from(T.products)
    .select("id", { count: "exact", head: true })
    .or(`brand_slug.eq.${slug},brand_id.eq.${ensured.brand.id}`);

  const cap = access.entitlements.productCap;
  if (cap != null && (count ?? 0) >= cap) {
    return NextResponse.json(
      { error: `This plan can list ${cap} pieces. Hide or remove one, or upgrade.` },
      { status: 400 }
    );
  }

  const id = `p-${Date.now().toString(36)}`;
  const productSlug = `${slug}-${slugify(name)}-${id.slice(-4)}`;
  const style = isStyleName(String(body.style ?? "")) ? String(body.style) : "Minimal";
  const row = {
    id,
    slug: productSlug,
    name,
    brand_id: String(ensured.brand.id),
    brand_slug: slug,
    label: String(ensured.brand.name),
    price: Math.max(0, Number(body.price ?? 0)),
    category: typeof body.category === "string" && body.category.trim() ? body.category.trim().slice(0, 40) : "Apparel",
    style,
    badge: typeof body.badge === "string" && body.badge.trim() ? body.badge.trim().slice(0, 24) : null,
    image: typeof body.image === "string" ? body.image : "",
    description: typeof body.description === "string" ? body.description.trim().slice(0, 500) : "",
    retailer: "",
    featured: false,
    stock: body.stock == null || body.stock === "" ? null : Number(body.stock),
    live: body.live !== false,
    source: "real",
    owner_id: profile.id,
    image_x: clampFocus(body.image_x),
    image_y: clampFocus(body.image_y),
  };

  const inserted = await supabase.from(T.products).insert(row).select("*").maybeSingle();
  if (inserted.error) {
    if (isMissingColumn(inserted.error)) {
      const fallback = { ...row } as Record<string, unknown>;
      delete fallback.owner_id;
      delete fallback.image_x;
      delete fallback.image_y;
      const retry = await supabase.from(T.products).insert(fallback).select("*").maybeSingle();
      if (retry.error) return NextResponse.json({ error: APPEARANCE_SQL_HINT, needsSql: true }, { status: 400 });
      return NextResponse.json({ product: retry.data, needsSql: true });
    }
    return NextResponse.json({ error: inserted.error.message }, { status: 400 });
  }

  return NextResponse.json({ product: inserted.data });
}

export async function PATCH(request: Request) {
  const profile = await getProfile();
  if (!profile || !canStudio(profile)) return NextResponse.json({ error: "Brand accounts only." }, { status: 403 });

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Service role is required." }, { status: 503 });
  const ensured = await ensureStudioBrand(supabase, profile);
  if (!ensured.brand) return NextResponse.json({ error: ensured.error }, { status: 400 });

  const body = (await request.json()) as Record<string, unknown>;
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "Missing piece." }, { status: 400 });

  const existing = await supabase.from(T.products).select("*").eq("id", id).maybeSingle();
  if (!existing.data || (existing.data.brand_id !== ensured.brand.id && existing.data.brand_slug !== ensured.brand.slug)) {
    return NextResponse.json({ error: "That piece is not yours." }, { status: 403 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") patch.name = body.name.trim().slice(0, 80);
  if (body.price != null) patch.price = Math.max(0, Number(body.price));
  if (typeof body.category === "string") patch.category = body.category.trim().slice(0, 40);
  if (isStyleName(String(body.style ?? ""))) patch.style = body.style;
  if (typeof body.description === "string") patch.description = body.description.trim().slice(0, 500);
  if (typeof body.image === "string") patch.image = body.image;
  if (typeof body.badge === "string") patch.badge = body.badge.trim().slice(0, 24) || null;
  if (body.live != null) patch.live = Boolean(body.live);
  if (body.image_x != null) patch.image_x = clampFocus(body.image_x);
  if (body.image_y != null) patch.image_y = clampFocus(body.image_y);

  const { error } = await supabase.from(T.products).update(patch).eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: isMissingColumn(error) ? APPEARANCE_SQL_HINT : error.message, needsSql: isMissingColumn(error) },
      { status: 400 }
    );
  }
  const { data } = await supabase.from(T.products).select("*").eq("id", id).maybeSingle();
  return NextResponse.json({ product: data });
}

export async function DELETE(request: Request) {
  const profile = await getProfile();
  if (!profile || !canStudio(profile)) return NextResponse.json({ error: "Brand accounts only." }, { status: 403 });

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Service role is required." }, { status: 503 });
  const ensured = await ensureStudioBrand(supabase, profile);
  if (!ensured.brand) return NextResponse.json({ error: ensured.error }, { status: 400 });

  const body = (await request.json()) as Record<string, unknown>;
  const id = String(body.id ?? "");
  const existing = await supabase.from(T.products).select("*").eq("id", id).maybeSingle();
  if (!existing.data || (existing.data.brand_id !== ensured.brand.id && existing.data.brand_slug !== ensured.brand.slug)) {
    return NextResponse.json({ error: "That piece is not yours." }, { status: 403 });
  }

  const { error } = await supabase.from(T.products).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
