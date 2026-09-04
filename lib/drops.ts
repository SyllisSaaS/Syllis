import { EARLY_RESERVE_CAP_RATIO } from "./plans";
import { demoProducts } from "./data";

export type DropStatus = "early" | "public" | "ended";

export type Drop = {
  id: string;
  slug: string;
  productId: string;
  brandSlug: string;
  name: string;
  image: string;
  price: number;
  label: string;
  totalStock: number;
  earlyOpensAt: string;
  publicOpensAt: string;
  endsAt: string;
};

function iso(daysFromNow: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const drops: Drop[] = [
  {
    id: "d1",
    slug: "washed-heavy-zip-drop",
    productId: "p1",
    brandSlug: "north-00",
    name: "Washed Heavy Zip Hoodie",
    image: demoProducts[0].image,
    price: 92,
    label: "North / 00",
    totalStock: 40,
    earlyOpensAt: iso(-2),
    publicOpensAt: iso(5),
    endsAt: iso(12),
  },
  {
    id: "d2",
    slug: "utility-shell-drop",
    productId: "p2",
    brandSlug: "kuro-supply",
    name: "Utility Shell Jacket",
    image: demoProducts[1].image,
    price: 148,
    label: "Kuro Supply",
    totalStock: 24,
    earlyOpensAt: iso(-1),
    publicOpensAt: iso(6),
    endsAt: iso(14),
  },
  {
    id: "d3",
    slug: "technical-vest-drop",
    productId: "p5",
    brandSlug: "morrow-objects",
    name: "Technical Vest 02",
    image: demoProducts[4].image,
    price: 112,
    label: "Morrow Objects",
    totalStock: 20,
    earlyOpensAt: iso(1),
    publicOpensAt: iso(8),
    endsAt: iso(16),
  },
  {
    id: "d4",
    slug: "studio-overshirt-public",
    productId: "p8",
    brandSlug: "ninth-form",
    name: "Studio Overshirt",
    image: demoProducts[7].image,
    price: 98,
    label: "Civic Uniform",
    totalStock: 30,
    earlyOpensAt: iso(-10),
    publicOpensAt: iso(-3),
    endsAt: iso(9),
  },
];

export function earlyReserveCap(totalStock: number) {
  return Math.max(1, Math.floor(totalStock * EARLY_RESERVE_CAP_RATIO));
}

export function dropStatus(drop: Drop, now = new Date()): DropStatus {
  const t = now.getTime();
  if (t >= new Date(drop.endsAt).getTime()) return "ended";
  if (t >= new Date(drop.publicOpensAt).getTime()) return "public";
  return "early";
}

export function getDrop(slugOrId: string) {
  return drops.find((d) => d.slug === slugOrId || d.id === slugOrId);
}

export function dropForProduct(productId: string) {
  return drops.find((d) => d.productId === productId);
}
