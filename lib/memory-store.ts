import { RESERVATION_HOLD_MINUTES } from "./plans";
import type { AnalyticsEvent, AnalyticsEventName } from "./analytics";
import { earlyReserveCap, getDrop } from "./drops";

export type Reservation = {
  id: string;
  drop_id: string;
  user_id: string;
  email: string | null;
  size: string | null;
  pool: "early" | "public";
  status: "held" | "expired" | "released";
  created_at: string;
  expires_at: string;
};

type Store = {
  events: AnalyticsEvent[];
  reservations: Reservation[];
  layouts: Record<string, { widgets: string[]; chartType: string }>;
};

function globalStore(): Store {
  const g = globalThis as typeof globalThis & { __syllisStore?: Store };
  if (!g.__syllisStore) {
    g.__syllisStore = { events: [], reservations: [], layouts: {} };
  }
  return g.__syllisStore;
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function expireReservations(now = new Date()) {
  const store = globalStore();
  for (const row of store.reservations) {
    if (row.status === "held" && new Date(row.expires_at).getTime() <= now.getTime()) {
      row.status = "expired";
    }
  }
}

export function listReservations(dropId: string) {
  expireReservations();
  return globalStore().reservations.filter((row) => row.drop_id === dropId);
}

export function activeReservations(dropId: string) {
  return listReservations(dropId).filter((row) => row.status === "held");
}

export function inventoryForDrop(dropId: string) {
  const drop = getDrop(dropId);
  if (!drop) return null;
  const held = activeReservations(drop.id);
  const earlyHeld = held.filter((row) => row.pool === "early").length;
  const publicHeld = held.filter((row) => row.pool === "public").length;
  const earlyCap = earlyReserveCap(drop.totalStock);
  const publicCap = drop.totalStock - earlyCap;
  return {
    totalStock: drop.totalStock,
    earlyCap,
    publicCap,
    earlyHeld,
    publicHeld,
    earlyRemaining: Math.max(0, earlyCap - earlyHeld),
    publicRemaining: Math.max(0, publicCap - publicHeld),
  };
}

export function userHasHold(dropId: string, userId: string) {
  return activeReservations(dropId).some((row) => row.user_id === userId);
}

export function listUserHolds(userId: string) {
  expireReservations();
  return globalStore().reservations.filter((row) => row.user_id === userId && row.status === "held");
}

export function releaseHold(userId: string, input: { holdId?: string; dropId?: string }) {
  expireReservations();
  const row = globalStore().reservations.find((item) => {
    if (item.user_id !== userId || item.status !== "held") return false;
    if (input.holdId) return item.id === input.holdId;
    if (input.dropId) return item.drop_id === input.dropId;
    return false;
  });
  if (!row) throw new Error("No active hold to release");
  row.status = "released";
  return row;
}

export function createReservation(input: {
  dropId: string;
  userId: string;
  email: string | null;
  size: string | null;
  pool: "early" | "public";
}) {
  expireReservations();
  const drop = getDrop(input.dropId);
  if (!drop) throw new Error("Drop not found");
  if (userHasHold(drop.id, input.userId)) {
    throw new Error("You already have a hold on this drop");
  }
  const stock = inventoryForDrop(drop.id);
  if (!stock) throw new Error("Drop not found");
  if (input.pool === "early" && stock.earlyRemaining <= 0) {
    throw new Error("Early reserve pool is full");
  }
  if (input.pool === "public" && stock.publicRemaining <= 0) {
    throw new Error("Public stock is gone");
  }
  const now = new Date();
  const expires = new Date(now.getTime() + RESERVATION_HOLD_MINUTES * 60 * 1000);
  const row: Reservation = {
    id: id("rsv"),
    drop_id: drop.id,
    user_id: input.userId,
    email: input.email,
    size: input.size,
    pool: input.pool,
    status: "held",
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
  };
  globalStore().reservations.push(row);
  return row;
}

export function insertEvent(input: {
  name: AnalyticsEventName;
  path?: string | null;
  productId?: string | null;
  brandSlug?: string | null;
  userId?: string | null;
}) {
  const event: AnalyticsEvent = {
    id: id("evt"),
    name: input.name,
    path: input.path ?? null,
    product_id: input.productId ?? null,
    brand_slug: input.brandSlug ?? null,
    user_id: input.userId ?? null,
    created_at: new Date().toISOString(),
  };
  globalStore().events.push(event);
  return event;
}

export function listEvents(filter: { brandSlug?: string | null; from?: Date; to?: Date }) {
  return globalStore().events.filter((event) => {
    if (filter.brandSlug && event.brand_slug !== filter.brandSlug) return false;
    const t = new Date(event.created_at).getTime();
    if (filter.from && t < filter.from.getTime()) return false;
    if (filter.to && t > filter.to.getTime()) return false;
    return true;
  });
}

export function getLayout(userId: string) {
  return globalStore().layouts[userId] ?? null;
}

export function setLayout(userId: string, layout: { widgets: string[]; chartType: string }) {
  globalStore().layouts[userId] = layout;
  return layout;
}
