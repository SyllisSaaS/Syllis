import type Stripe from "stripe";
import { isMissingColumn } from "@/lib/appearance";
import { isPayoutsReady, ORDERS_SQL_HINT, TRACKING_SQL_HINT, retrieveConnectAccount } from "@/lib/connect";
import { getStripe } from "@/lib/stripe";
import { T } from "@/lib/tables";
import { createServiceClient } from "@/lib/supabase/service";
import { lookupTracking } from "@/lib/tracking-lookup";
import {
  isVerifiedTrackingStatus,
  newTrackToken,
  trackingUrl,
  type TrackingEvent,
  validateTracking,
} from "@/lib/tracking";

export type OrderRow = {
  id: string;
  product_id: string | null;
  product_slug: string | null;
  product_name: string;
  brand_id: string | null;
  brand_slug: string | null;
  brand_user_id: string | null;
  buyer_user_id?: string | null;
  buyer_email: string | null;
  amount_pence: number;
  platform_fee_pence: number;
  brand_pence: number;
  take_rate: number;
  currency: string;
  status: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  stripe_transfer_id: string | null;
  shipping: Record<string, unknown> | null;
  tracking_number: string | null;
  tracking_carrier?: string | null;
  tracking_status?: string | null;
  tracking_verified_at?: string | null;
  tracking_last_checked_at?: string | null;
  tracking_events?: TrackingEvent[] | null;
  tracking_url?: string | null;
  tracking_provider_id?: string | null;
  track_token?: string | null;
  buyer_confirmed_at?: string | null;
  ship_by?: string | null;
  shipped_at: string | null;
  transferred_at: string | null;
  created_at: string;
};

export type PublicOrder = {
  id: string;
  product_name: string;
  brand_slug: string | null;
  amount_pence: number;
  status: string;
  tracking_number: string | null;
  tracking_carrier: string | null;
  tracking_status: string | null;
  tracking_url: string | null;
  tracking_events: TrackingEvent[];
  tracking_verified: boolean;
  buyer_confirmed: boolean;
  shipped_at: string | null;
  created_at: string;
  shipping: { name?: string | null; address?: Record<string, string | null> | null } | null;
};

function trackingHint(error: { message?: string; code?: string } | null | undefined) {
  const message = (error?.message || "").toLowerCase();
  if (
    message.includes("track_token") ||
    message.includes("tracking_carrier") ||
    message.includes("tracking_status") ||
    message.includes("tracking_events") ||
    message.includes("buyer_confirmed") ||
    message.includes("ship_by")
  ) {
    return TRACKING_SQL_HINT;
  }
  return isMissingColumn(error) ? ORDERS_SQL_HINT : error?.message || "Could not update that order.";
}

function db() {
  return createServiceClient();
}

export async function syncPaidCheckoutSessions(orders: OrderRow[]) {
  const stripe = getStripe();
  if (!stripe) return;
  for (const order of orders) {
    if (order.status !== "pending" || !order.stripe_session_id) continue;
    try {
      const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
      if (session.payment_status === "paid") await fulfillProductSession(session);
    } catch {
      // Session may still be open.
    }
  }
}

export async function fulfillProductSession(session: Stripe.Checkout.Session) {
  if (session.metadata?.kind !== "product") return;
  const supabase = db();
  const stripe = getStripe();
  if (!supabase || !stripe) return;

  const orderId = session.metadata.orderId;
  if (!orderId) return;

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  let chargeId: string | null = null;
  if (paymentIntentId) {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    chargeId = typeof intent.latest_charge === "string" ? intent.latest_charge : intent.latest_charge?.id ?? null;
  }

  const extra = session as Stripe.Checkout.Session & {
    collected_information?: { shipping_details?: { name?: string | null; address?: Stripe.Address | null } };
    shipping_details?: { name?: string | null; address?: Stripe.Address | null };
  };
  const shipping = {
    name: extra.shipping_details?.name ?? extra.collected_information?.shipping_details?.name ?? session.customer_details?.name ?? null,
    email: session.customer_details?.email ?? null,
    phone: session.customer_details?.phone ?? null,
    address:
      extra.shipping_details?.address ??
      extra.collected_information?.shipping_details?.address ??
      session.customer_details?.address ??
      null,
  };

  const shipBy = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from(T.orders)
    .update({
      status: "paid",
      buyer_email: session.customer_details?.email ?? session.customer_email ?? null,
      stripe_payment_intent_id: paymentIntentId ?? null,
      stripe_charge_id: chargeId,
      shipping,
      ship_by: shipBy,
    })
    .eq("id", orderId)
    .eq("status", "pending");

  if (error && isMissingColumn(error)) {
    const retry = await supabase
      .from(T.orders)
      .update({
        status: "paid",
        buyer_email: session.customer_details?.email ?? session.customer_email ?? null,
        stripe_payment_intent_id: paymentIntentId ?? null,
        stripe_charge_id: chargeId,
        shipping,
      })
      .eq("id", orderId)
      .eq("status", "pending");
    if (retry.error) {
      console.error(trackingHint(error));
      return;
    }
  } else if (error) {
    console.error(error.message);
    return;
  }

  const productId = session.metadata.productId;
  if (productId) {
    const { data: product } = await supabase.from(T.products).select("stock").eq("id", productId).maybeSingle();
    if (product && product.stock != null) {
      const next = Math.max(0, Number(product.stock) - 1);
      await supabase.from(T.products).update({ stock: next }).eq("id", productId);
    }
  }
}

export async function markOrderRefunded(chargeId: string) {
  const supabase = db();
  if (!supabase || !chargeId) return;
  const { data: order } = await supabase.from(T.orders).select("*").eq("stripe_charge_id", chargeId).maybeSingle();
  if (!order) return;

  const stripe = getStripe();
  if (stripe && order.stripe_transfer_id) {
    try {
      await stripe.transfers.createReversal(order.stripe_transfer_id, {
        amount: order.brand_pence,
      });
    } catch {
      // Already reversed or transfer not reversible — status still flips.
    }
  }

  await supabase.from(T.orders).update({ status: "refunded" }).eq("id", order.id);

  if (order.product_id && order.status !== "refunded") {
    const { data: product } = await supabase.from(T.products).select("stock").eq("id", order.product_id).maybeSingle();
    if (product && product.stock != null) {
      await supabase.from(T.products).update({ stock: Number(product.stock) + 1 }).eq("id", order.product_id);
    }
  }
}

export async function markOrderDisputed(chargeId: string) {
  const supabase = db();
  if (!supabase || !chargeId) return;
  const { data: order } = await supabase.from(T.orders).select("*").eq("stripe_charge_id", chargeId).maybeSingle();
  if (!order) return;

  const stripe = getStripe();
  if (stripe && order.stripe_transfer_id) {
    try {
      await stripe.transfers.createReversal(order.stripe_transfer_id, {
        amount: order.brand_pence,
      });
    } catch {
      // Recovery attempted; platform still owns the dispute debit.
    }
  }

  await supabase.from(T.orders).update({ status: "disputed" }).eq("id", order.id);
}

export async function syncConnectAccount(accountId: string) {
  const supabase = db();
  const stripe = getStripe();
  if (!supabase || !stripe || !accountId) return;
  try {
    const account = await retrieveConnectAccount(stripe, accountId);
    const { error } = await supabase
      .from(T.brands)
      .update({ payouts_ready: isPayoutsReady(account) })
      .eq("stripe_connect_id", account.id);
    if (error && isMissingColumn(error)) {
      console.error(ORDERS_SQL_HINT);
    }
  } catch {
    // Account may still be provisioning.
  }
}

export function publicOrderView(order: OrderRow): PublicOrder {
  const shipping = (order.shipping ?? null) as PublicOrder["shipping"];
  return {
    id: order.id,
    product_name: order.product_name,
    brand_slug: order.brand_slug,
    amount_pence: order.amount_pence,
    status: order.status,
    tracking_number: order.tracking_number,
    tracking_carrier: order.tracking_carrier ?? null,
    tracking_status: order.tracking_status ?? "none",
    tracking_url: order.tracking_url ?? trackingUrl(order.tracking_carrier, order.tracking_number),
    tracking_events: Array.isArray(order.tracking_events) ? order.tracking_events : [],
    tracking_verified: Boolean(order.tracking_verified_at) || isVerifiedTrackingStatus(order.tracking_status),
    buyer_confirmed: Boolean(order.buyer_confirmed_at),
    shipped_at: order.shipped_at,
    created_at: order.created_at,
    shipping,
  };
}

export function orderIsVerified(order: OrderRow) {
  return Boolean(order.buyer_confirmed_at) || isVerifiedTrackingStatus(order.tracking_status);
}

export async function ensureTrackTokens(orders: OrderRow[]) {
  const supabase = db();
  if (!supabase) return orders;
  const missing = orders.filter((order) => !order.track_token);
  for (const order of missing) {
    const token = newTrackToken();
    const { data, error } = await supabase
      .from(T.orders)
      .update({ track_token: token })
      .eq("id", order.id)
      .select("*")
      .maybeSingle();
    if (error && isMissingColumn(error)) {
      console.error(TRACKING_SQL_HINT);
      return orders;
    }
    if (data) Object.assign(order, data);
    else order.track_token = token;
  }
  return orders;
}

async function connectIdForOrder(order: OrderRow) {
  const supabase = db();
  if (!supabase) return null;
  const read = async (column: "id" | "slug" | "owner_id", value: string) => {
    const { data } = await supabase
      .from(T.brands)
      .select("stripe_connect_id, payouts_ready")
      .eq(column, value)
      .maybeSingle();
    if (data?.payouts_ready && typeof data.stripe_connect_id === "string" && data.stripe_connect_id) {
      return data.stripe_connect_id;
    }
    return null;
  };
  if (order.brand_id) {
    const found = await read("id", order.brand_id);
    if (found) return found;
  }
  if (order.brand_slug) {
    const found = await read("slug", order.brand_slug);
    if (found) return found;
  }
  if (order.brand_user_id) {
    const found = await read("owner_id", order.brand_user_id);
    if (found) return found;
  }
  return null;
}

export async function releaseOrderTransfer(order: OrderRow, connectId: string) {
  const stripe = getStripe();
  const supabase = db();
  if (!stripe || !supabase) throw new Error("Stripe or database is not configured.");
  if (!order.stripe_charge_id) throw new Error("This order has no charge to transfer from yet.");
  if (order.stripe_transfer_id || order.status === "transferred") return order;
  if (order.status === "refunded" || order.status === "disputed" || order.status === "cancelled") {
    throw new Error("This order cannot be paid out.");
  }

  const transfer = await stripe.transfers.create({
    amount: order.brand_pence,
    currency: order.currency || "gbp",
    destination: connectId,
    source_transaction: order.stripe_charge_id,
    metadata: { orderId: order.id },
  });

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(T.orders)
    .update({
      status: "transferred",
      stripe_transfer_id: transfer.id,
      transferred_at: now,
      tracking_verified_at: order.tracking_verified_at ?? now,
    })
    .eq("id", order.id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(trackingHint(error));
  return (data as OrderRow) ?? { ...order, status: "transferred", stripe_transfer_id: transfer.id };
}

export async function releaseIfVerified(order: OrderRow, force = false) {
  if (order.stripe_transfer_id || order.status === "transferred") return order;
  if (!force && !orderIsVerified(order)) return order;
  const connectId = await connectIdForOrder(order);
  if (!connectId) return order;
  try {
    return await releaseOrderTransfer(order, connectId);
  } catch {
    return order;
  }
}

export async function submitOrderTracking(order: OrderRow, trackingNumber: string, carrierId: string) {
  const supabase = db();
  if (!supabase) throw new Error("Database is not configured.");
  if (order.status !== "paid" && order.status !== "shipped") {
    throw new Error("This order is not waiting to ship.");
  }
  const parsed = validateTracking(carrierId, trackingNumber);
  if (!parsed.ok) throw new Error(parsed.error);

  const lookup = await lookupTracking(parsed.carrier.id, parsed.number);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(T.orders)
    .update({
      status: "shipped",
      tracking_number: parsed.number,
      tracking_carrier: parsed.carrier.id,
      tracking_status: lookup.status,
      tracking_events: lookup.events,
      tracking_url: lookup.url,
      tracking_provider_id: lookup.providerId,
      tracking_last_checked_at: now,
      tracking_verified_at: lookup.verified ? now : null,
      shipped_at: order.shipped_at ?? now,
    })
    .eq("id", order.id)
    .select("*")
    .maybeSingle();

  if (error || !data) throw new Error(trackingHint(error));
  return releaseIfVerified(data as OrderRow);
}

export async function refreshOrderTracking(order: OrderRow, force = false) {
  if (!order.tracking_number || !order.tracking_carrier) return order;
  if (order.status !== "shipped" && order.status !== "paid") return order;
  if (!force && order.tracking_last_checked_at) {
    const age = Date.now() - new Date(order.tracking_last_checked_at).getTime();
    if (age < 90_000) return order;
  }

  const lookup = await lookupTracking(order.tracking_carrier, order.tracking_number);
  const supabase = db();
  if (!supabase) return order;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(T.orders)
    .update({
      tracking_status: lookup.status,
      tracking_events: lookup.events,
      tracking_url: lookup.url ?? order.tracking_url,
      tracking_provider_id: lookup.providerId ?? order.tracking_provider_id,
      tracking_last_checked_at: now,
      tracking_verified_at: lookup.verified ? order.tracking_verified_at ?? now : order.tracking_verified_at,
    })
    .eq("id", order.id)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    if (error && isMissingColumn(error)) console.error(TRACKING_SQL_HINT);
    return order;
  }
  return releaseIfVerified(data as OrderRow);
}

export async function applyTrackingLookup(trackingNumber: string, lookup: import("@/lib/tracking").TrackingLookup) {
  const supabase = db();
  if (!supabase) return 0;
  const number = trackingNumber.replace(/\s+/g, "").toUpperCase();
  const { data, error } = await supabase
    .from(T.orders)
    .select("*")
    .eq("tracking_number", number)
    .in("status", ["paid", "shipped"]);
  if (error || !data?.length) {
    if (error && isMissingColumn(error)) console.error(TRACKING_SQL_HINT);
    return 0;
  }
  const now = new Date().toISOString();
  let updated = 0;
  for (const row of data as OrderRow[]) {
    const { data: next, error: writeError } = await supabase
      .from(T.orders)
      .update({
        tracking_status: lookup.status,
        tracking_events: lookup.events,
        tracking_url: lookup.url ?? row.tracking_url,
        tracking_provider_id: lookup.providerId ?? row.tracking_provider_id,
        tracking_last_checked_at: now,
        tracking_verified_at: lookup.verified ? row.tracking_verified_at ?? now : row.tracking_verified_at,
      })
      .eq("id", row.id)
      .select("*")
      .maybeSingle();
    if (writeError || !next) continue;
    await releaseIfVerified(next as OrderRow);
    updated += 1;
  }
  return updated;
}

export async function confirmOrderReceived(order: OrderRow) {
  const supabase = db();
  if (!supabase) throw new Error("Database is not configured.");
  if (order.status === "refunded" || order.status === "disputed" || order.status === "cancelled") {
    throw new Error("This order cannot be confirmed.");
  }
  if (order.buyer_confirmed_at) return releaseIfVerified(order);

  const now = new Date().toISOString();
  const events = Array.isArray(order.tracking_events) ? [...order.tracking_events] : [];
  events.push({ at: now, status: "delivered", message: "Shopper confirmed they received the piece." });

  const { data, error } = await supabase
    .from(T.orders)
    .update({
      buyer_confirmed_at: now,
      tracking_status: "delivered",
      tracking_verified_at: order.tracking_verified_at ?? now,
      tracking_events: events,
      status: order.status === "paid" ? "shipped" : order.status,
    })
    .eq("id", order.id)
    .select("*")
    .maybeSingle();

  if (error || !data) throw new Error(trackingHint(error));
  return releaseIfVerified(data as OrderRow);
}

export async function syncShippedTracking(orders: OrderRow[]) {
  const next: OrderRow[] = [];
  for (const order of orders) {
    if (order.status === "shipped" && !order.stripe_transfer_id) {
      next.push(await refreshOrderTracking(order));
    } else {
      next.push(order);
    }
  }
  return next;
}

export async function syncPendingTracking(limit = 40) {
  const supabase = db();
  if (!supabase) return 0;
  const { data, error } = await supabase
    .from(T.orders)
    .select("*")
    .eq("status", "shipped")
    .is("stripe_transfer_id", null)
    .order("tracking_last_checked_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  if (error || !data) {
    if (error && isMissingColumn(error)) console.error(TRACKING_SQL_HINT);
    return 0;
  }
  let checked = 0;
  for (const row of data as OrderRow[]) {
    await refreshOrderTracking(row, true);
    checked += 1;
  }
  return checked;
}
