import Stripe from "stripe";
import { brandPlans, shopperPlans, type PlanId } from "./plans";
import type { FoundingBand } from "./founding";
import { T } from "./tables";
import { createClient } from "./supabase/server";
import { createServiceClient } from "./supabase/service";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_RESTRICTED_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function priceIdFromEnv(plan: PlanId) {
  const map: Partial<Record<PlanId, string | undefined>> = {
    early: process.env.STRIPE_PRICE_EARLY,
    starter: process.env.STRIPE_PRICE_STARTER,
    growth: process.env.STRIPE_PRICE_GROWTH,
    premium: process.env.STRIPE_PRICE_PREMIUM,
  };
  return map[plan] ?? null;
}

async function pricesDb() {
  return createServiceClient() ?? (await createClient());
}

export async function resolvePriceId(plan: PlanId) {
  const fromEnv = priceIdFromEnv(plan);
  if (fromEnv) return fromEnv;
  const supabase = await pricesDb();
  if (!supabase) return null;
  const { data } = await supabase.from(T.stripePrices).select("price_id").eq("plan", plan).maybeSingle();
  return (data?.price_id as string | undefined) ?? null;
}

export function planFromPriceId(priceId: string | undefined | null): PlanId | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_EARLY) return "early";
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "starter";
  if (priceId === process.env.STRIPE_PRICE_GROWTH) return "growth";
  if (priceId === process.env.STRIPE_PRICE_PREMIUM) return "premium";
  return null;
}

export async function foundingCheckoutDiscount(offer: {
  active: boolean;
  percentOff: number;
  months: number;
  band: FoundingBand | null;
}) {
  if (!offer.active) {
    return { trialPeriodDays: undefined as number | undefined, discounts: undefined as { coupon: string }[] | undefined };
  }

  if (offer.percentOff >= 100) {
    return { trialPeriodDays: 30, discounts: undefined };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { trialPeriodDays: undefined, discounts: undefined };
  }

  const id = `founding_off_${offer.percentOff}`;
  try {
    await stripe.coupons.retrieve(id);
  } catch {
    await stripe.coupons.create({
      id,
      percent_off: offer.percentOff,
      duration: "repeating",
      duration_in_months: 3,
      name: `Founding ${offer.percentOff}% off`,
    });
  }

  return { trialPeriodDays: undefined, discounts: [{ coupon: id }] };
}

const CATALOG: { plan: Exclude<PlanId, "free">; name: string; pounds: number }[] = [
  { plan: "early", name: shopperPlans[1].name, pounds: shopperPlans[1].price },
  { plan: "starter", name: brandPlans[0].name, pounds: brandPlans[0].price },
  { plan: "growth", name: brandPlans[1].name, pounds: brandPlans[1].price },
  { plan: "premium", name: brandPlans[2].name, pounds: brandPlans[2].price },
];

export async function ensureStripeCatalog() {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured.");

  const listed = await stripe.products.list({ limit: 100, active: true });
  const saved: { plan: string; price_id: string; product_id: string }[] = [];

  for (const item of CATALOG) {
    let product = listed.data.find((row) => row.metadata?.syllis_plan === item.plan);
    if (!product) {
      product = await stripe.products.create({
        name: `Syllis ${item.name}`,
        metadata: { syllis_plan: item.plan },
      });
    }
    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
    let price = prices.data.find(
      (row) =>
        row.currency === "gbp" &&
        row.recurring?.interval === "month" &&
        row.unit_amount === item.pounds * 100
    );
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        currency: "gbp",
        unit_amount: item.pounds * 100,
        recurring: { interval: "month" },
        metadata: { syllis_plan: item.plan },
      });
    }
    saved.push({ plan: item.plan, price_id: price.id, product_id: product.id });
  }

  const supabase = await pricesDb();
  if (supabase) {
    for (const row of saved) {
      await supabase.from(T.stripePrices).upsert({
        plan: row.plan,
        price_id: row.price_id,
        product_id: row.product_id,
        updated_at: new Date().toISOString(),
      });
    }
  }

  return saved;
}

export async function storedPriceMap() {
  const supabase = await pricesDb();
  const map: Partial<Record<Exclude<PlanId, "free">, string>> = {
    early: process.env.STRIPE_PRICE_EARLY,
    starter: process.env.STRIPE_PRICE_STARTER,
    growth: process.env.STRIPE_PRICE_GROWTH,
    premium: process.env.STRIPE_PRICE_PREMIUM,
  };
  if (!supabase) return map;
  const { data } = await supabase.from(T.stripePrices).select("plan, price_id");
  for (const row of data ?? []) {
    const plan = row.plan as Exclude<PlanId, "free">;
    if (!map[plan] && row.price_id) map[plan] = row.price_id as string;
  }
  return map;
}
