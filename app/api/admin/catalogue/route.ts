import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  demoAdRows,
  demoBrandRows,
  demoProductRows,
  loadAdminCatalogue,
} from "@/lib/catalogue";
import { buildFakeCatalogue } from "@/lib/fake-catalogue";
import { createServiceClient } from "@/lib/supabase/service";
import { T } from "@/lib/tables";
import { isAdPlacement } from "@/lib/ads";
import { isStyleName, slugify, type CatalogueSource, type StyleName } from "@/lib/data";

function db() {
  return createServiceClient();
}

function httpUrl(value: unknown) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : "";
  } catch {
    return "";
  }
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  return NextResponse.json(await loadAdminCatalogue());
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const supabase = db();
  if (!supabase) return NextResponse.json({ error: "Service role is required." }, { status: 503 });

  const body = (await request.json()) as Record<string, unknown>;
  const action = String(body.action ?? "");

  async function done(message: string) {
    const catalogue = await loadAdminCatalogue();
    if (!catalogue.tablesReady) {
      return NextResponse.json(
        {
          error:
            "Catalogue tables are missing. Paste the Catalogue section from supabase/schema.sql into the Supabase SQL editor, then refresh.",
          tablesReady: false,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, message, ...catalogue });
  }

  if (action === "seed-demo") {
    const brands = await supabase.from(T.brands).upsert(demoBrandRows(), { onConflict: "id" });
    if (brands.error) return NextResponse.json({ error: brands.error.message }, { status: 400 });
    const products = await supabase.from(T.products).upsert(demoProductRows(), { onConflict: "id" });
    if (products.error) return NextResponse.json({ error: products.error.message }, { status: 400 });
    const ads = await supabase.from(T.ads).upsert(demoAdRows(), { onConflict: "id" });
    if (ads.error) return NextResponse.json({ error: ads.error.message }, { status: 400 });
    return done("Demo pack is live on the public site. Hide or delete it whenever you want.");
  }

  if (action === "seed-fakes") {
    const count = Number(body.count ?? 4);
    const includeAds = body.ads !== false;
    const niches = Array.isArray(body.niches)
      ? (body.niches.filter((item): item is StyleName => typeof item === "string" && isStyleName(item)) as StyleName[])
      : [];
    const pack = buildFakeCatalogue(niches, count, includeAds);
    const brands = await supabase.from(T.brands).upsert(pack.brands, { onConflict: "id" });
    if (brands.error) return NextResponse.json({ error: brands.error.message }, { status: 400 });
    const products = await supabase.from(T.products).upsert(pack.products, { onConflict: "id" });
    if (products.error) return NextResponse.json({ error: products.error.message }, { status: 400 });
    if (pack.ads.length) {
      const ads = await supabase.from(T.ads).upsert(pack.ads, { onConflict: "id" });
      if (ads.error) return NextResponse.json({ error: ads.error.message }, { status: 400 });
    }
    return done(
      `Seeded ${pack.products.length} fake pieces across ${pack.brands.length} niches${includeAds ? " with test ads" : ""}.`
    );
  }

  if (action === "set-live") {
    const table = body.table === "brands" ? T.brands : body.table === "ads" ? T.ads : T.products;
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
    const { error } = await supabase.from(table).update({ live: Boolean(body.live) }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return done(body.live ? "Published." : "Hidden from the public site.");
  }

  if (action === "set-source-live") {
    const source = body.source as CatalogueSource;
    if (source !== "demo" && source !== "seed" && source !== "real") {
      return NextResponse.json({ error: "source required." }, { status: 400 });
    }
    const live = Boolean(body.live);
    await Promise.all([
      supabase.from(T.brands).update({ live }).eq("source", source),
      supabase.from(T.products).update({ live }).eq("source", source),
      supabase.from(T.ads).update({ live }).eq("source", source),
    ]);
    return done(live ? `${source} listings are public.` : `${source} listings are hidden.`);
  }

  if (action === "delete") {
    const table = body.table === "brands" ? T.brands : body.table === "ads" ? T.ads : T.products;
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return done("Removed.");
  }

  if (action === "clear") {
    const source = body.source as CatalogueSource | "all";
    const run = async (table: string) => {
      const query = supabase.from(table).delete();
      return source === "all" ? query.neq("id", "") : query.eq("source", source);
    };
    await Promise.all([run(T.brands), run(T.products), run(T.ads)]);
    return done(source === "all" ? "Catalogue emptied." : `${source} listings removed.`);
  }

  if (action === "upsert-brand") {
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Brand name required." }, { status: 400 });
    const slug = slugify(String(body.slug ?? name));
    const id = String(body.id ?? `real-brand-${slug}`);
    const { error } = await supabase.from(T.brands).upsert({
      id,
      slug,
      name,
      niche: String(body.niche ?? ""),
      location: String(body.location ?? ""),
      description: String(body.description ?? ""),
      image: httpUrl(body.image),
      featured: Boolean(body.featured),
      live: body.live !== false,
      source: "real",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return done("Brand saved.");
  }

  if (action === "upsert-product") {
    const name = String(body.name ?? "").trim();
    const label = String(body.label ?? "").trim();
    if (!name || !label) return NextResponse.json({ error: "Name and brand label required." }, { status: 400 });
    const slug = slugify(String(body.slug ?? name));
    const id = String(body.id ?? `real-${slug}`);
    const { error } = await supabase.from(T.products).upsert({
      id,
      slug,
      name,
      brand_id: typeof body.brandId === "string" ? body.brandId : null,
      brand_slug: slugify(String(body.brandSlug ?? label)),
      label,
      price: Number(body.price ?? 0),
      category: String(body.category ?? "Apparel"),
      style: String(body.style ?? "Minimal"),
      badge: typeof body.badge === "string" && body.badge ? body.badge : null,
      image: httpUrl(body.image),
      description: String(body.description ?? ""),
      retailer: String(body.retailer ?? label),
      featured: Boolean(body.featured),
      stock: body.stock == null || body.stock === "" ? null : Number(body.stock),
      live: body.live !== false,
      source: "real",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return done("Product saved.");
  }

  if (action === "upsert-ad") {
    const title = String(body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "Ad title required." }, { status: 400 });
    const placement = String(body.placement ?? "All");
    if (!isAdPlacement(placement)) {
      return NextResponse.json({ error: "Pick All, Brand, Drop, or a niche." }, { status: 400 });
    }
    const id = String(body.id ?? `real-ad-${slugify(title)}`);
    const { error } = await supabase.from(T.ads).upsert({
      id,
      title,
      brand: String(body.brand ?? "Syllis"),
      image: httpUrl(body.image),
      placement,
      days: Number(body.days) === 7 ? 7 : 3,
      base_price: Number(body.basePrice ?? 100),
      live: body.live !== false,
      source: "real",
      product_slug: body.productSlug ? String(body.productSlug) : null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return done("Ad saved.");
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
