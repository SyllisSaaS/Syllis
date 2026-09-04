import { slugify, styles, type StyleName } from "./data";

const IMAGES: Record<StyleName, string[]> = {
  Techwear: [
    "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",
  ],
  Washed: [
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85",
  ],
  Minimal: [
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=85",
  ],
  Graphic: [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=85",
  ],
  Utility: [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85",
  ],
  Outdoor: [
    "https://images.unsplash.com/photo-1506629905607-d9b1c3d4b7f4?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",
  ],
  Workwear: [
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",
  ],
  Archive: [
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=85",
  ],
  Skate: [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=85",
  ],
};

const NAMES: Record<StyleName, { name: string; category: string }[]> = {
  Techwear: [
    { name: "Shell Jacket", category: "Jackets" },
    { name: "Technical Vest", category: "Outerwear" },
    { name: "Zip Cargo", category: "Trousers" },
    { name: "Hard Shell Pant", category: "Trousers" },
    { name: "Modular Fleece", category: "Knitwear" },
  ],
  Washed: [
    { name: "Heavy Zip Hoodie", category: "Hoodies" },
    { name: "Pigment Long Sleeve", category: "T-Shirts" },
    { name: "Faded Crew", category: "Knitwear" },
    { name: "Broken-in Pant", category: "Trousers" },
    { name: "Sun-fade Shirt", category: "Shirts" },
  ],
  Minimal: [
    { name: "Studio Overshirt", category: "Shirts" },
    { name: "Down Layer", category: "Outerwear" },
    { name: "Clean Crew", category: "Knitwear" },
    { name: "Straight Trouser", category: "Trousers" },
    { name: "Box Tee", category: "T-Shirts" },
  ],
  Graphic: [
    { name: "Study Tee", category: "T-Shirts" },
    { name: "Archive Print Hoodie", category: "Hoodies" },
    { name: "Mark Long Sleeve", category: "T-Shirts" },
    { name: "Poster Sweat", category: "Knitwear" },
  ],
  Utility: [
    { name: "Cargo Trouser", category: "Trousers" },
    { name: "Field Jacket", category: "Jackets" },
    { name: "Tool Vest", category: "Outerwear" },
    { name: "Pocket Shirt", category: "Shirts" },
  ],
  Outdoor: [
    { name: "Trail Anorak", category: "Jackets" },
    { name: "Track Pant", category: "Trousers" },
    { name: "Packable Shell", category: "Jackets" },
    { name: "Camp Fleece", category: "Knitwear" },
  ],
  Workwear: [
    { name: "Double Knee Pant", category: "Trousers" },
    { name: "Chore Coat", category: "Jackets" },
    { name: "Shop Shirt", category: "Shirts" },
    { name: "Duck Canvas Vest", category: "Outerwear" },
  ],
  Archive: [
    { name: "Archive Knit", category: "Knitwear" },
    { name: "Reissue Tee", category: "T-Shirts" },
    { name: "Sample Trouser", category: "Trousers" },
    { name: "Deadstock Shirt", category: "Shirts" },
  ],
  Skate: [
    { name: "Baggy Jean", category: "Trousers" },
    { name: "Deck Tee", category: "T-Shirts" },
    { name: "Zip Hoodie", category: "Hoodies" },
    { name: "Coach Jacket", category: "Jackets" },
  ],
};

const FAKE_BRANDS: Record<StyleName, { name: string; location: string; description: string }> = {
  Techwear: {
    name: "Kuro Desk",
    location: "Amsterdam",
    description: "Functional layers for testing Syllis discovery.",
  },
  Washed: {
    name: "North Atelier",
    location: "London",
    description: "Washed essentials used as fake catalogue filler.",
  },
  Minimal: {
    name: "Civic Sample",
    location: "Copenhagen",
    description: "Quiet silhouettes for layout and ad tests.",
  },
  Graphic: {
    name: "Hours Test",
    location: "Manchester",
    description: "Graphic blanks so Discover has something to filter.",
  },
  Utility: {
    name: "Form Work",
    location: "Leeds",
    description: "Utility pieces generated for niche density tests.",
  },
  Outdoor: {
    name: "Still Trail",
    location: "Glasgow",
    description: "Outdoor layers for sponsored-placement checks.",
  },
  Workwear: {
    name: "Ninth Sample",
    location: "Leeds",
    description: "Workwear filler for the catalogue lab.",
  },
  Archive: {
    name: "Forme Archive",
    location: "Paris",
    description: "Archive-shaped fakes, not real stock.",
  },
  Skate: {
    name: "Deck Room",
    location: "London",
    description: "Skate silhouettes for filter and ad tests.",
  },
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
          image: products[0]?.image ?? IMAGES.Washed[0],
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
