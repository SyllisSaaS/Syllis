import { cache } from "react";
import type { Ad, Brand, CatalogueSource, Collection, Product } from "./data";
import { clampFocus } from "./appearance";
import { demoAds, demoBrands, demoProducts, slugify, styles } from "./data";
import { createClient } from "./supabase/server";
import { createServiceClient } from "./supabase/service";
import { T } from "./tables";

export type CatalogueRowMeta = {
  live: boolean;
  source: CatalogueSource;
};

export type AdminBrand = Brand & CatalogueRowMeta;
export type AdminProduct = Product & CatalogueRowMeta;
export type AdminAd = Ad & CatalogueRowMeta;

export type LiveCatalogue = {
  products: Product[];
  brands: Brand[];
  ads: Ad[];
  collections: Collection[];
  tablesReady: boolean;
};

export type AdminCatalogue = {
  products: AdminProduct[];
  brands: AdminBrand[];
  ads: AdminAd[];
  tablesReady: boolean;
};

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

function mapBrand(row: Record<string, unknown>): AdminBrand {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    niche: String(row.niche ?? ""),
    location: String(row.location ?? ""),
    description: String(row.description ?? ""),
    image: String(row.image ?? ""),
    featured: Boolean(row.featured),
    products: 0,
    live: Boolean(row.live),
    source: (row.source as CatalogueSource) || "real",
    avatarUrl: (row.avatar_url as string | null) || undefined,
    avatarX: clampFocus(row.avatar_x),
    avatarY: clampFocus(row.avatar_y),
    bannerMode: row.banner_mode === "image" ? "image" : "color",
    bannerColor: String(row.banner_color ?? "#141414"),
    bannerUrl: (row.banner_url as string | null) || undefined,
    bannerX: clampFocus(row.banner_x),
    bannerY: clampFocus(row.banner_y),
  };
}

function mapProduct(row: Record<string, unknown>): AdminProduct {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    label: String(row.label),
    price: Number(row.price),
    category: String(row.category ?? "Apparel"),
    style: String(row.style ?? "Minimal"),
    badge: (row.badge as string | null) || undefined,
    image: String(row.image ?? ""),
    description: String(row.description ?? ""),
    retailer: String(row.retailer ?? ""),
    featured: Boolean(row.featured),
    stock: row.stock == null ? undefined : Number(row.stock),
    brandSlug: (row.brand_slug as string | null) || slugify(String(row.label ?? "")),
    live: Boolean(row.live),
    source: (row.source as CatalogueSource) || "real",
    imageX: clampFocus(row.image_x),
    imageY: clampFocus(row.image_y),
  };
}

function mapAd(row: Record<string, unknown>): AdminAd {
  return {
    id: String(row.id),
    title: String(row.title),
    brand: String(row.brand),
    image: String(row.image ?? ""),
    placement: (row.placement as Ad["placement"]) || "All",
    days: row.days === 7 ? 7 : 3,
    basePrice: Number(row.base_price ?? 100),
    productSlug: (row.product_slug as string | null) || undefined,
    endsAt: (row.ends_at as string | null) || undefined,
    live: Boolean(row.live),
    source: (row.source as CatalogueSource) || "real",
  };
}

export function collectionsFromProducts(products: Product[]): Collection[] {
  return styles
    .map((style) => {
      const items = products.filter((product) => product.style === style);
      if (items.length === 0) return null;
      return {
        slug: slugify(style),
        title: `${style} niche`,
        subtitle: `${items.length} live piece${items.length === 1 ? "" : "s"}`,
        image: items[0].image,
        products: items.map((item) => item.id),
      } satisfies Collection;
    })
    .filter((item): item is Collection => Boolean(item));
}

async function catalogueDb(service: boolean) {
  if (service) return createServiceClient() ?? (await createClient());
  return (await createClient()) ?? createServiceClient();
}

export async function loadAdminCatalogue(): Promise<AdminCatalogue> {
  const supabase = await catalogueDb(true);
  if (!supabase) {
    return { products: [], brands: [], ads: [], tablesReady: false };
  }

  const [brandsRes, productsRes, adsRes] = await Promise.all([
    supabase.from(T.brands).select("*").order("created_at", { ascending: true }),
    supabase.from(T.products).select("*").order("created_at", { ascending: true }),
    supabase.from(T.ads).select("*").order("created_at", { ascending: true }),
  ]);

  if (isMissingTable(brandsRes.error) || isMissingTable(productsRes.error) || isMissingTable(adsRes.error)) {
    return { products: [], brands: [], ads: [], tablesReady: false };
  }

  const brands = (brandsRes.data ?? []).map((row) => mapBrand(row as Record<string, unknown>));
  const products = (productsRes.data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
  const ads = (adsRes.data ?? []).map((row) => mapAd(row as Record<string, unknown>));
  const counts = new Map<string, number>();
  for (const product of products) {
    const key = product.brandSlug || "";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return {
    tablesReady: true,
    ads,
    products,
    brands: brands.map((brand) => ({ ...brand, products: counts.get(brand.slug) ?? 0 })),
  };
}

export const getLiveCatalogue = cache(async (): Promise<LiveCatalogue> => {
  const { expireAndPromoteAds } = await import("./ads-fulfill");
  await expireAndPromoteAds();
  const admin = await loadAdminCatalogue();
  if (!admin.tablesReady) {
    return { products: [], brands: [], ads: [], collections: [], tablesReady: false };
  }
  const products = admin.products.filter((row) => row.live);
  const brands = admin.brands.filter((row) => row.live);
  const now = Date.now();
  const ads = admin.ads.filter((row) => {
    if (!row.live) return false;
    if (row.endsAt && new Date(row.endsAt).getTime() <= now) return false;
    return true;
  });
  return {
    tablesReady: true,
    products,
    brands,
    ads,
    collections: collectionsFromProducts(products),
  };
});

export async function findLiveProduct(slug: string) {
  const { products } = await getLiveCatalogue();
  return products.find((product) => product.slug === slug) ?? null;
}

export async function findLiveBrand(slug: string) {
  const { brands } = await getLiveCatalogue();
  return brands.find((brand) => brand.slug === slug) ?? null;
}

export function demoBrandRows() {
  return demoBrands.map((brand) => ({
    id: brand.id,
    slug: brand.slug,
    name: brand.name,
    niche: brand.niche,
    location: brand.location,
    description: brand.description,
    image: brand.image,
    featured: Boolean(brand.featured),
    live: true,
    source: "demo" as const,
  }));
}

export function demoProductRows() {
  return demoProducts.map((product) => {
    const brand = demoBrands.find((item) => item.name === product.label);
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand_id: brand?.id ?? null,
      brand_slug: brand?.slug ?? slugify(product.label),
      label: product.label,
      price: product.price,
      category: product.category,
      style: product.style,
      badge: product.badge ?? null,
      image: product.image,
      description: product.description,
      retailer: product.retailer,
      featured: Boolean(product.featured),
      stock: product.stock ?? null,
      live: true,
      source: "demo" as const,
    };
  });
}

export function demoAdRows() {
  return demoAds.map((ad) => ({
    id: ad.id,
    title: ad.title,
    brand: ad.brand,
    image: ad.image,
    placement: ad.placement,
    days: ad.days,
    base_price: ad.basePrice,
    live: true,
    source: "demo" as const,
  }));
}
