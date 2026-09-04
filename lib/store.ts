import type { AnalyticsEvent, AnalyticsEventName } from "./analytics";
import { earlyReserveCap, getDrop } from "./drops";
import { RESERVATION_HOLD_MINUTES } from "./plans";
import { createClient } from "./supabase/server";
import { T } from "./tables";
import * as memory from "./memory-store";

export async function expireReservations() {
  const supabase = await createClient();
  if (supabase) {
    await supabase
      .from(T.reservations)
      .update({ status: "expired" })
      .eq("status", "held")
      .lte("expires_at", new Date().toISOString());
  }
  memory.expireReservations();
}

export async function inventoryForDrop(dropId: string) {
  await expireReservations();
  const drop = getDrop(dropId);
  if (!drop) return null;

  const supabase = await createClient();
  let earlyHeld = 0;
  let publicHeld = 0;

  if (supabase) {
    const { data } = await supabase
      .from(T.reservations)
      .select("pool")
      .eq("drop_id", drop.id)
      .eq("status", "held");
    earlyHeld = (data ?? []).filter((row) => row.pool === "early").length;
    publicHeld = (data ?? []).filter((row) => row.pool === "public").length;
  } else {
    const stock = memory.inventoryForDrop(drop.id);
    if (stock) return stock;
  }

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

export async function userHasHold(dropId: string, userId: string) {
  await expireReservations();
  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase
      .from(T.reservations)
      .select("id")
      .eq("drop_id", dropId)
      .eq("user_id", userId)
      .eq("status", "held")
      .maybeSingle();
    return Boolean(data);
  }
  return memory.userHasHold(dropId, userId);
}

export async function listUserHolds(userId: string) {
  await expireReservations();
  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase
      .from(T.reservations)
      .select("*")
      .eq("user_id", userId)
      .eq("status", "held")
      .order("expires_at", { ascending: true });
    return (data ?? []) as memory.Reservation[];
  }
  return memory.listUserHolds(userId);
}

export async function releaseHold(userId: string, input: { holdId?: string; dropId?: string }) {
  await expireReservations();
  const supabase = await createClient();
  if (supabase) {
    let query = supabase
      .from(T.reservations)
      .update({ status: "released" })
      .eq("user_id", userId)
      .eq("status", "held");
    if (input.holdId) query = query.eq("id", input.holdId);
    else if (input.dropId) query = query.eq("drop_id", input.dropId);
    else throw new Error("Pick a hold to release");
    const { data, error } = await query.select("*").maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("No active hold to release");
    return data as memory.Reservation;
  }
  return memory.releaseHold(userId, input);
}

export async function createReservation(input: {
  dropId: string;
  userId: string;
  email: string | null;
  size: string | null;
  pool: "early" | "public";
}) {
  const drop = getDrop(input.dropId);
  if (!drop) throw new Error("Drop not found");
  if (await userHasHold(drop.id, input.userId)) {
    throw new Error("You already have a hold on this drop");
  }
  const stock = await inventoryForDrop(drop.id);
  if (!stock) throw new Error("Drop not found");
  if (input.pool === "early" && stock.earlyRemaining <= 0) {
    throw new Error("Early reserve pool is full");
  }
  if (input.pool === "public" && stock.publicRemaining <= 0) {
    throw new Error("Public stock is gone");
  }

  const now = new Date();
  const expires = new Date(now.getTime() + RESERVATION_HOLD_MINUTES * 60 * 1000);
  const row = {
    drop_id: drop.id,
    user_id: input.userId,
    email: input.email,
    size: input.size,
    pool: input.pool,
    status: "held" as const,
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
  };

  const supabase = await createClient();
  if (supabase) {
    const { data, error } = await supabase.from(T.reservations).insert(row).select("*").single();
    if (error) throw new Error(error.message);
    return data;
  }

  return memory.createReservation(input);
}

export async function insertEvent(input: {
  name: AnalyticsEventName;
  path?: string | null;
  productId?: string | null;
  brandSlug?: string | null;
  userId?: string | null;
}) {
  const supabase = await createClient();
  if (supabase) {
    const { error } = await supabase.from(T.events).insert({
      name: input.name,
      path: input.path ?? null,
      product_id: input.productId ?? null,
      brand_slug: input.brandSlug ?? null,
      user_id: input.userId ?? null,
    });
    if (!error) return;
  }
  return memory.insertEvent(input);
}

export async function listEvents(filter: { brandSlug?: string | null; from?: Date; to?: Date }) {
  const supabase = await createClient();
  if (supabase) {
    let query = supabase.from(T.events).select("*").is("archive_batch_id", null);
    if (filter.brandSlug) query = query.eq("brand_slug", filter.brandSlug);
    if (filter.from) query = query.gte("created_at", filter.from.toISOString());
    if (filter.to) query = query.lte("created_at", filter.to.toISOString());
    const { data, error } = await query;
    if (!error) return (data ?? []) as AnalyticsEvent[];
    if ((error.message || "").toLowerCase().includes("archive_batch_id")) {
      let fallback = supabase.from(T.events).select("*");
      if (filter.brandSlug) fallback = fallback.eq("brand_slug", filter.brandSlug);
      if (filter.from) fallback = fallback.gte("created_at", filter.from.toISOString());
      if (filter.to) fallback = fallback.lte("created_at", filter.to.toISOString());
      const retry = await fallback;
      if (!retry.error) return (retry.data ?? []) as AnalyticsEvent[];
    }
  }
  return memory.listEvents(filter);
}

export async function getLayout(userId: string) {
  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase
      .from(T.layouts)
      .select("widgets, chart_type")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) return { widgets: data.widgets as string[], chartType: data.chart_type as string };
  }
  return memory.getLayout(userId);
}

export async function setLayout(userId: string, layout: { widgets: string[]; chartType: string }) {
  const supabase = await createClient();
  if (supabase) {
    await supabase.from(T.layouts).upsert({
      user_id: userId,
      widgets: layout.widgets,
      chart_type: layout.chartType,
      updated_at: new Date().toISOString(),
    });
  }
  return memory.setLayout(userId, layout);
}
