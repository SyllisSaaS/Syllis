import { slugify } from "./data";
import { adSlotCap, isAdDays, isAdPlacement } from "./ads";
import { T } from "./tables";
import { createClient } from "./supabase/server";
import { createServiceClient } from "./supabase/service";

function adIdFor(booking: Record<string, unknown>) {
  return `paid-ad-${slugify(String(booking.title))}-${String(booking.id).slice(0, 8)}`;
}

async function db() {
  return createServiceClient() ?? (await createClient());
}

export async function countRenewals(userId: string, placement: string) {
  const supabase = await db();
  if (!supabase) return 0;
  const { count } = await supabase
    .from(T.adBookings)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("placement", placement)
    .in("status", ["paid", "live", "ended"]);
  return count ?? 0;
}

export async function liveAdCount(placement: string) {
  const supabase = await db();
  if (!supabase) return 0;
  const now = new Date().toISOString();
  const { data } = await supabase.from(T.ads).select("id, live, ends_at, placement").eq("live", true).eq("placement", placement);
  return (data ?? []).filter((row) => !row.ends_at || String(row.ends_at) > now).length;
}

export async function fulfillAdBooking(input: {
  bookingId?: string | null;
  sessionId?: string | null;
  userId?: string | null;
  amountPence: number;
}) {
  const supabase = await db();
  if (!supabase) return { error: "Database is not configured." };

  let booking: Record<string, unknown> | null = null;
  if (input.bookingId) {
    const { data } = await supabase.from(T.adBookings).select("*").eq("id", input.bookingId).maybeSingle();
    booking = data as Record<string, unknown> | null;
  }
  if (!booking && input.sessionId) {
    const { data } = await supabase.from(T.adBookings).select("*").eq("stripe_session_id", input.sessionId).maybeSingle();
    booking = data as Record<string, unknown> | null;
  }
  if (!booking) return { error: "Booking not found." };
  if (booking.status === "live" || booking.status === "paid") return { ok: true, already: true };

  const placement = String(booking.placement);
  if (!isAdPlacement(placement)) return { error: "Invalid placement." };
  const days = Number(booking.days);
  if (!isAdDays(days)) return { error: "Invalid duration." };

  const cap = adSlotCap(placement);
  const used = await liveAdCount(placement);
  const starts = new Date();
  const ends = new Date(starts.getTime() + days * 24 * 60 * 60 * 1000);
  const wait = used >= cap;
  const adId = adIdFor(booking);

  if (!wait) {
    await goLiveAd(supabase, booking, {
      adId,
      placement,
      days,
      amountPence: input.amountPence,
      userId: input.userId,
      starts,
      ends,
    });
  }

  await supabase
    .from(T.adBookings)
    .update({
      status: wait ? "paid" : "live",
      ad_id: wait ? null : adId,
      amount_pence: input.amountPence,
      stripe_session_id: input.sessionId ?? booking.stripe_session_id,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
    })
    .eq("id", booking.id);

  if (input.sessionId && input.amountPence > 0) {
    await supabase.from(T.ledger).insert({
      source: "ad",
      amount_pence: input.amountPence,
      currency: "gbp",
      description: `${placement} ad · ${days} days`,
      user_id: (booking.user_id as string | null) ?? input.userId ?? null,
      stripe_id: input.sessionId,
    });
  }

  return { ok: true, wait, adId: wait ? null : adId };
}

type CatalogueDb = NonNullable<Awaited<ReturnType<typeof db>>>;

async function goLiveAd(
  supabase: CatalogueDb,
  booking: Record<string, unknown>,
  opts: {
    adId: string;
    placement: string;
    days: number;
    amountPence: number;
    userId?: string | null;
    starts: Date;
    ends: Date;
  }
) {
  await supabase.from(T.ads).upsert({
    id: opts.adId,
    title: booking.title,
    brand: booking.brand,
    image: booking.image,
    placement: opts.placement,
    days: opts.days,
    base_price: Math.round(opts.amountPence / 100),
    live: true,
    source: "real",
    product_slug: booking.product_slug ?? null,
    ends_at: opts.ends.toISOString(),
    booking_id: booking.id,
    user_id: booking.user_id ?? opts.userId ?? null,
  });
}

/** End expired live ads and fill empty slots from paid waiters. */
export async function expireAndPromoteAds() {
  const supabase = await db();
  if (!supabase) return;

  const now = new Date().toISOString();
  const { data: expired } = await supabase
    .from(T.ads)
    .select("id, booking_id")
    .eq("live", true)
    .not("ends_at", "is", null)
    .lt("ends_at", now);

  for (const row of expired ?? []) {
    await supabase.from(T.ads).update({ live: false }).eq("id", row.id);
    if (row.booking_id) {
      await supabase.from(T.adBookings).update({ status: "ended" }).eq("id", row.booking_id).eq("status", "live");
    }
  }

  const { data: waiting } = await supabase
    .from(T.adBookings)
    .select("*")
    .eq("status", "paid")
    .order("created_at", { ascending: true });

  for (const row of waiting ?? []) {
    const booking = row as Record<string, unknown>;
    const placement = String(booking.placement);
    if (!isAdPlacement(placement)) continue;
    const days = Number(booking.days);
    if (!isAdDays(days)) continue;
    if ((await liveAdCount(placement)) >= adSlotCap(placement)) continue;

    const starts = new Date();
    const ends = new Date(starts.getTime() + days * 24 * 60 * 60 * 1000);
    const adId = adIdFor(booking);
    await goLiveAd(supabase, booking, {
      adId,
      placement,
      days,
      amountPence: Number(booking.amount_pence ?? 0),
      starts,
      ends,
    });
    await supabase
      .from(T.adBookings)
      .update({
        status: "live",
        ad_id: adId,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
      })
      .eq("id", booking.id);
  }
}
