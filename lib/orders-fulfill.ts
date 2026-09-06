import type Stripe from "stripe";
import { isMissingColumn } from "@/lib/appearance";
import { isPayoutsReady, ORDERS_SQL_HINT, retrieveConnectAccount } from "@/lib/connect";
import { getStripe } from "@/lib/stripe";
import { T } from "@/lib/tables";
import { createServiceClient } from "@/lib/supabase/service";

export type OrderRow = {
  id: string;
  product_id: string | null;
  product_slug: string | null;
  product_name: string;
  brand_id: string | null;
  brand_slug: string | null;
  brand_user_id: string | null;
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
  shipped_at: string | null;
  transferred_at: string | null;
  created_at: string;
};

function db() {
  return createServiceClient();
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

  const { error } = await supabase
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

  if (error && isMissingColumn(error)) {
    console.error(ORDERS_SQL_HINT);
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

export async function releaseOrderTransfer(order: OrderRow, trackingNumber: string, connectId: string) {
  const stripe = getStripe();
  const supabase = db();
  if (!stripe || !supabase) throw new Error("Stripe or database is not configured.");
  if (!order.stripe_charge_id) throw new Error("This order has no charge to transfer from yet.");
  if (order.stripe_transfer_id) return order;

  const transfer = await stripe.transfers.create({
    amount: order.brand_pence,
    currency: order.currency || "gbp",
    destination: connectId,
    source_transaction: order.stripe_charge_id,
    metadata: { orderId: order.id },
  });

  const { data, error } = await supabase
    .from(T.orders)
    .update({
      status: "transferred",
      tracking_number: trackingNumber,
      stripe_transfer_id: transfer.id,
      shipped_at: new Date().toISOString(),
      transferred_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(isMissingColumn(error) ? ORDERS_SQL_HINT : error.message);
  return (data as OrderRow) ?? order;
}
