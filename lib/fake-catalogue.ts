import { slugify, styles, type StyleName } from "./data";

const SHARED = [
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",
];

const IMAGES: Record<StyleName, string[]> = {
  Streetwear: SHARED,
  Skate: SHARED,
  Y2K: [
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=85",
    ...SHARED,
  ],
  Vintage: [
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=85",
  ],
  Graphic: [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=85",
  ],
  Minimal: [
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=1200&q=85",
  ],
  Techwear: [
    "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?auto=format&fit=crop&w=1200&q=85",
  ],
  Workwear: [
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",
  ],
  Outdoor: [
    "https://images.unsplash.com/photo-1506629905607-d9b1c3d4b7f4?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",
  ],
  Archive: [
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=85",
  ],
};

const NAMES: Record<StyleName, { name: string; category: string }[]> = {
  Streetwear: [
    { name: "Heavy Zip Hoodie", category: "Hoodies" },
    { name: "Baggy Jean", category: "Trousers" },
    { name: "Box Tee", category: "T-Shirts" },
  ],
  Skate: [
    { name: "Deck Tee", category: "T-Shirts" },
    { name: "Baggy Jean", category: "Trousers" },
    { name: "Coach Jacket", category: "Jackets" },
  ],
  Y2K: [
    { name: "Low Rise Trouser", category: "Trousers" },
    { name: "Baby Tee", category: "T-Shirts" },
    { name: "Butterfly Knit", category: "Knitwear" },
  ],
  Vintage: [
    { name: "Reissue Tee", category: "T-Shirts" },
    { name: "Sun-fade Shirt", category: "Shirts" },
    { name: "Broken-in Pant", category: "Trousers" },
  ],
  Graphic: [
    { name: "Study Tee", category: "T-Shirts" },
    { name: "Archive Print Hoodie", category: "Hoodies" },
  ],
  Minimal: [
    { name: "Clean Crew", category: "Knitwear" },
    { name: "Straight Trouser", category: "Trousers" },
  ],
  Techwear: [
    { name: "Shell Jacket", category: "Jackets" },
    { name: "Zip Cargo", category: "Trousers" },
  ],
  Workwear: [
    { name: "Double Knee Pant", category: "Trousers" },
    { name: "Chore Coat", category: "Jackets" },
  ],
  Outdoor: [
    { name: "Trail Anorak", category: "Jackets" },
    { name: "Packable Shell", category: "Jackets" },
  ],
  Archive: [
    { name: "Archive Knit", category: "Knitwear" },
    { name: "Sample Trouser", category: "Trousers" },
  ],
};

const FAKE_BRANDS: Record<StyleName, { name: string; location: string; description: string }> = {
  Streetwear: { name: "North Atelier", location: "London", description: "Streetwear filler for catalogue tests." },
  Skate: { name: "Deck Room", location: "London", description: "Skate silhouettes for filter tests." },
  Y2K: { name: "Hours Test", location: "Manchester", description: "Y2K filler for Discover filters." },
  Vintage: { name: "Forme Archive", location: "Paris", description: "Vintage-shaped fakes, not real stock." },
  Graphic: { name: "Mark Room", location: "Manchester", description: "Graphic blanks for layout tests." },
  Minimal: { name: "Civic Sample", location: "Copenhagen", description: "Quiet silhouettes for layout tests." },
  Techwear: { name: "Kuro Desk", location: "Amsterdam", description: "Functional layers for testing." },
  Workwear: { name: "Ninth Sample", location: "Leeds", description: "Workwear filler for the catalogue lab." },
  Outdoor: { name: "Still Trail", location: "Glasgow", description: "Outdoor layers for placement checks." },
  Archive: { name: "Forme Sample", location: "Paris", description: "Archive-shaped fakes, not real stock." },
};

function pick<T>(list: T[], index: number) {
  return list[index % list.length];
}

export function fakeBrandId(style: StyleName) {
  return `seed-brand-${slugify(style)}`;
}

export function buildFakeNiche(style: StyleName, count: number) {
  const brandMeta = FAKE_BRANDS[style];
  const brandId = fakeBrandId(style);
  const brandSlug = slugify(brandMeta.name);
  const names = NAMES[style];
  const images = IMAGES[style];
  const clipped = Math.max(1, Math.min(24, Math.round(count)));

  const brand = {
    id: brandId,
    slug: brandSlug,
    name: brandMeta.name,
    niche: style,
    location: brandMeta.location,
    description: brandMeta.description,
    image: images[0],
    featured: true,
    live: true,
    source: "seed" as const,
  };

  const products = Array.from({ length: clipped }, (_, index) => {
    const piece = pick(names, index);
    const name = `${piece.name} ${String(index + 1).padStart(2, "0")}`;
    const id = `seed-${slugify(style)}-${index + 1}`;
    return {
      id,
      slug: id,
      name,
      brand_id: brandId,
      brand_slug: brandSlug,
      label: brandMeta.name,
      price: 48 + ((index * 17) % 140),
      category: piece.category,
      style,
      badge: index === 0 ? "Test" : null,
      image: pick(images, index),
      description: `Fake ${style.toLowerCase()} piece for catalogue and ad tests. Not a real listing.`,
      retailer: brandMeta.name,
      featured: index < 2,
      stock: 12 + index,
      live: true,
      source: "seed" as const,
    };
  });

  const ad = {
    id: `seed-ad-${slugify(style)}`,
    title: `${brandMeta.name} — ${style} test slot`,
    brand: brandMeta.name,
    image: images[0],
    placement: style,
    days: 3 as const,
    base_price: 70,
    live: true,
    source: "seed" as const,
  };

  return { brand, products, ad };
}

export function buildFakeCatalogue(niches: StyleName[], count: number, includeAds: boolean) {
  const selected = niches.length ? niches : [...styles];
  const brands = selected.map((style) => buildFakeNiche(style, count).brand);
  const products = selected.flatMap((style) => buildFakeNiche(style, count).products);
  const ads = includeAds
    ? [
        {
          id: "seed-ad-all",
          title: `${products[0]?.label ?? "Syllis Test"} — All Syllis`,
          brand: products[0]?.label ?? "Syllis Test",
          image: products[0]?.image ?? IMAGES.Streetwear[0],
          placement: "All" as const,
          days: 7 as const,
          base_price: 100,
          live: true,
          source: "seed" as const,
        },
        ...selected.map((style) => buildFakeNiche(style, count).ad),
      ]
    : [];
  return { brands, products, ads };
}
