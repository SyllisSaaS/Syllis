export type Product = {
  id: string;
  slug: string;
  name: string;
  label: string;
  price: number;
  category: string;
  style: string;
  badge?: string;
  image: string;
  description: string;
  retailer: string;
  featured?: boolean;
  stock?: number;
  brandSlug?: string;
};

export type Brand = {
  id: string;
  slug: string;
  name: string;
  niche: string;
  location: string;
  description: string;
  image: string;
  featured?: boolean;
  products: number;
};

export const styles = [
  "Techwear",
  "Washed",
  "Minimal",
  "Graphic",
  "Utility",
  "Outdoor",
  "Workwear",
  "Archive",
  "Skate",
] as const;

export type StyleName = (typeof styles)[number];
export type AdPlacement = "All" | "Brand" | "Drop" | StyleName;
export type CatalogueSource = "demo" | "seed" | "real";

export function isStyleName(value: string): value is StyleName {
  return (styles as readonly string[]).includes(value);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type Ad = {
  id: string;
  title: string;
  brand: string;
  image: string;
  placement: AdPlacement;
  days: 3 | 7;
  basePrice: number;
  productSlug?: string;
  endsAt?: string;
};

export type Collection = {
  slug: string;
  title: string;
  subtitle: string;
  image: string;
  products: string[];
};

export const demoProducts: Product[] = [
  {
    id: "p1",
    slug: "washed-heavy-zip",
    name: "Washed Heavy Zip Hoodie",
    label: "North / 00",
    price: 92,
    category: "Hoodies",
    style: "Washed",
    badge: "Editor's pick",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=85",
    description: "A heavyweight everyday layer with a faded finish and relaxed shape. Designed to look better with wear.",
    retailer: "North / 00",
    featured: true,
    stock: 38,
  },
  {
    id: "p2",
    slug: "utility-shell-jacket",
    name: "Utility Shell Jacket",
    label: "Kuro Supply",
    price: 148,
    category: "Jackets",
    style: "Utility",
    badge: "New",
    image: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?auto=format&fit=crop&w=1200&q=85",
    description: "Lightweight technical outerwear with functional pocketing and a clean, understated profile.",
    retailer: "Kuro Supply",
    featured: true,
    stock: 24,
  },
  {
    id: "p3",
    slug: "raw-cargo-trouser",
    name: "Raw Cargo Trouser",
    label: "Ninth Form",
    price: 84,
    category: "Trousers",
    style: "Utility",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",
    description: "A straight cargo silhouette in washed cotton with considered utility details.",
    retailer: "Ninth Form",
    stock: 52,
  },
  {
    id: "p4",
    slug: "graphic-study-tee",
    name: "Graphic Study Tee",
    label: "Common Hours",
    price: 48,
    category: "T-Shirts",
    style: "Graphic",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85",
    description: "Heavy cotton tee with a minimal front mark and oversized back graphic.",
    retailer: "Common Hours",
    stock: 70,
  },
  {
    id: "p5",
    slug: "technical-vest",
    name: "Technical Vest 02",
    label: "Morrow Objects",
    price: 112,
    category: "Outerwear",
    style: "Techwear",
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=85",
    description: "Modular vest designed as a light outer layer with adjustable utility straps.",
    retailer: "Morrow Objects",
    featured: true,
    stock: 19,
  },
  {
    id: "p6",
    slug: "faded-track-pant",
    name: "Faded Track Pant",
    label: "Still / Moving",
    price: 76,
    category: "Trousers",
    style: "Outdoor",
    image: "https://images.unsplash.com/photo-1506629905607-d9b1c3d4b7f4?auto=format&fit=crop&w=1200&q=85",
    description: "Relaxed track trousers with a washed finish and soft structure.",
    retailer: "Still / Moving",
    stock: 41,
  },
  {
    id: "p7",
    slug: "archive-knit",
    name: "Archive Knit 01",
    label: "Forme",
    price: 118,
    category: "Knitwear",
    style: "Archive",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=85",
    description: "A textured knit with a slightly cropped silhouette and vintage-inspired construction.",
    retailer: "Forme",
    stock: 17,
  },
  {
    id: "p8",
    slug: "studio-overshirt",
    name: "Studio Overshirt",
    label: "Civic Uniform",
    price: 98,
    category: "Shirts",
    style: "Minimal",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85",
    description: "Clean overshirt built for layering, with a soft brushed finish.",
    retailer: "Civic Uniform",
    stock: 31,
  },
  {
    id: "p9",
    slug: "trail-anorak",
    name: "Trail Anorak",
    label: "North / 00",
    price: 164,
    category: "Jackets",
    style: "Outdoor",
    badge: "New",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",
    description: "A weather-ready pullover with a clean outdoor profile.",
    retailer: "North / 00",
    stock: 13,
  },
  {
    id: "p10",
    slug: "washed-long-sleeve",
    name: "Washed Long Sleeve",
    label: "Common Hours",
    price: 54,
    category: "T-Shirts",
    style: "Washed",
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1200&q=85",
    description: "Soft long-sleeve jersey with a worn-in pigment finish.",
    retailer: "Common Hours",
    stock: 64,
  },
  {
    id: "p11",
    slug: "double-knee-pant",
    name: "Double Knee Pant",
    label: "Ninth Form",
    price: 88,
    category: "Trousers",
    style: "Workwear",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85",
    description: "Relaxed workwear trouser with reinforced knee panels.",
    retailer: "Ninth Form",
    stock: 28,
  },
  {
    id: "p12",
    slug: "minimal-down-layer",
    name: "Minimal Down Layer",
    label: "Morrow Objects",
    price: 190,
    category: "Outerwear",
    style: "Minimal",
    image: "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=1200&q=85",
    description: "Lightweight insulated layer designed to sit cleanly under larger shells.",
    retailer: "Morrow Objects",
    stock: 12,
  },
];

export const demoBrands: Brand[] = [
  {
    id: "b1",
    slug: "north-00",
    name: "North / 00",
    niche: "Washed streetwear",
    location: "London",
    description: "Heavyweight essentials, washed finishes and quiet graphics.",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85",
    featured: true,
    products: 18,
  },
  {
    id: "b2",
    slug: "kuro-supply",
    name: "Kuro Supply",
    niche: "Technical streetwear",
    location: "Amsterdam",
    description: "Functional layers with a stripped-back technical language.",
    image: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?auto=format&fit=crop&w=1200&q=85",
    featured: true,
    products: 26,
  },
  {
    id: "b3",
    slug: "morrow-objects",
    name: "Morrow Objects",
    niche: "Modern utility",
    location: "Copenhagen",
    description: "Modular garments designed for everyday movement.",
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=85",
    featured: true,
    products: 34,
  },
  {
    id: "b4",
    slug: "common-hours",
    name: "Common Hours",
    niche: "Graphic essentials",
    location: "Manchester",
    description: "Heavy cotton, considered graphics and relaxed proportions.",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85",
    featured: true,
    products: 11,
  },
  {
    id: "b5",
    slug: "ninth-form",
    name: "Ninth Form",
    niche: "Workwear",
    location: "Leeds",
    description: "Utility trousers and hard-wearing everyday pieces.",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",
    products: 21,
  },
];

export const demoCollections: Collection[] = [
  {
    slug: "washed-edit",
    title: "The Washed Edit",
    subtitle: "Faded, heavyweight, broken in.",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1600&q=85",
    products: ["p1", "p6", "p10"],
  },
  {
    slug: "after-dark",
    title: "After Dark",
    subtitle: "A quieter side of streetwear.",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1600&q=85",
    products: ["p2", "p5", "p8"],
  },
  {
    slug: "utility",
    title: "Utility / Everyday",
    subtitle: "Useful without looking technical.",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=85",
    products: ["p3", "p5", "p11"],
  },
];

export const demoAds: Ad[] = [
  {
    id: "ad1",
    title: "Kuro Supply — SS26",
    brand: "Kuro Supply",
    image: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?auto=format&fit=crop&w=1600&q=85",
    placement: "All",
    days: 3,
    basePrice: 100,
    productSlug: "utility-shell-jacket",
  },
  {
    id: "ad2",
    title: "North / 00 — Washed Drop",
    brand: "North / 00",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1600&q=85",
    placement: "Washed",
    days: 7,
    basePrice: 80,
    productSlug: "washed-heavy-zip",
  },
  {
    id: "ad3",
    title: "Morrow Objects — Utility 02",
    brand: "Morrow Objects",
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1600&q=85",
    placement: "Techwear",
    days: 3,
    basePrice: 70,
    productSlug: "technical-vest",
  },
];

export { brandPlans, shopperPlans as userPlans } from "./plans";

export const adPricing = {
  all: { 3: 100, 7: 200 },
  niche: { 3: 70, 7: 135 },
  brand: { 3: 180, 7: 320 },
  drop: { 3: 240, 7: 420 },
  renewalMultiplier: 1.45,
  renewalCap: 4,
  slots: { all: 3, niche: 1, brand: 2, drop: 2 },
};

export function adRenewalPrice(base: number, timesRenewed: number) {
  const steps = Math.min(Math.max(0, timesRenewed), adPricing.renewalCap);
  let price = base;
  for (let i = 0; i < steps; i += 1) {
    price = Math.round(price * adPricing.renewalMultiplier);
  }
  return price;
}

export function adsForPlacement(ads: Ad[], placement: AdPlacement) {
  const cap =
    placement === "All"
      ? adPricing.slots.all
      : placement === "Brand"
        ? adPricing.slots.brand
        : placement === "Drop"
          ? adPricing.slots.drop
          : adPricing.slots.niche;
  return ads.filter((ad) => ad.placement === placement).slice(0, cap);
}

export function resolveAdHref(ad: Ad, products: Product[], brands: Brand[] = []) {
  if (ad.productSlug) return `/product/${ad.productSlug}`;
  if (ad.placement === "Drop") return "/drops";
  if (ad.placement === "Brand") {
    const brand = brands.find((item) => item.name.toLowerCase() === ad.brand.toLowerCase());
    return brand ? `/brands/${brand.slug}` : "/brands";
  }
  const brandName = ad.brand.toLowerCase();
  const fromBrand = products.filter((product) => product.label.toLowerCase() === brandName);
  const nicheMatch =
    ad.placement !== "All" ? fromBrand.find((product) => product.style === ad.placement) : undefined;
  const product =
    nicheMatch || fromBrand[0] || products.find((item) => item.image === ad.image);
  if (product) return `/product/${product.slug}`;
  const brand = brands.find((item) => item.name.toLowerCase() === brandName);
  if (brand) return `/brands/${brand.slug}`;
  if (ad.placement !== "All") return `/discover?style=${encodeURIComponent(ad.placement)}`;
  return "/discover";
}
