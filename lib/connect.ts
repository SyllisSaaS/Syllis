import type Stripe from "stripe";
import { isMissingColumn } from "@/lib/appearance";
import { paymentsLive } from "@/lib/billing";
import { siteUrl } from "@/lib/env";
import { isBrandPlan, type PlanId } from "@/lib/plans";
import { getStripe } from "@/lib/stripe";
import { ensureStudioBrand } from "@/lib/studio";
import { T } from "@/lib/tables";
import { createServiceClient } from "@/lib/supabase/service";
import type { Profile } from "@/lib/profile";

export const ORDERS_SQL_HINT =
  "Paste supabase/orders.sql into the Supabase SQL editor, then refresh. It adds Connect columns and the syllis_orders table.";

export const TRACKING_SQL_HINT =
  "Paste supabase/tracking.sql into the Supabase SQL editor, then refresh. It adds verified tracking columns.";

export const SALE_TAKE: Record<"starter" | "growth" | "premium", number> = {
  starter: 0.1,
  growth: 0.08,
  premium: 0.06,
};

type RecipientAccount = Awaited<ReturnType<Stripe["v2"]["core"]["accounts"]["retrieve"]>>;

export function saleTakeRate(plan: PlanId | string | null | undefined) {
  if (plan === "growth") return SALE_TAKE.growth;
  if (plan === "premium") return SALE_TAKE.premium;
  return SALE_TAKE.starter;
}

export function splitSalePence(amountPence: number, plan: PlanId | string | null | undefined) {
  const take = saleTakeRate(plan);
  const brandPence = Math.max(0, Math.round(amountPence * (1 - take)));
  return {
    take,
    brandPence,
    platformFeePence: Math.max(0, amountPence - brandPence),
  };
}

export function poundsToPence(price: number) {
  return Math.round(Number(price) * 100);
}

/** Stripe Account Links require https, including localhost. */
export function connectSiteUrl() {
  return siteUrl().replace(/^http:\/\//, "https://");
}

export function isPayoutsReady(account: RecipientAccount) {
  const balance = account.configuration?.recipient?.capabilities?.stripe_balance;
  const transfers = balance?.stripe_transfers?.status;
  const payouts = balance?.payouts?.status;
  return transfers === "active" && (payouts === "active" || payouts == null);
}

export async function retrieveConnectAccount(stripe: Stripe, accountId: string) {
  return stripe.v2.core.accounts.retrieve(accountId, {
    include: ["configuration.recipient", "identity", "requirements"],
  });
}

export async function syncBrandPayouts(brandId: string, account: RecipientAccount) {
  const supabase = createServiceClient();
  if (!supabase) return isPayoutsReady(account);
  const ready = isPayoutsReady(account);
  const { error } = await supabase
    .from(T.brands)
    .update({ stripe_connect_id: account.id, payouts_ready: ready })
    .eq("id", brandId);
  if (error && isMissingColumn(error)) {
    throw new Error(ORDERS_SQL_HINT);
  }
  return ready;
}

async function createOnboardingLink(stripe: Stripe, accountId: string) {
  const origin = connectSiteUrl();
  const link = await stripe.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["recipient"],
        collection_options: { fields: "eventually_due" },
        refresh_url: `${origin}/studio?connect=refresh`,
        return_url: `${origin}/studio?connect=return`,
      },
    },
  });
  return link.url;
}

export async function ensureConnectAccount(profile: Profile) {
  const stripe = getStripe();
  if (!stripe) return { error: "Stripe is not configured." as const, brand: null, account: null, url: null };

  const supabase = createServiceClient();
  if (!supabase) return { error: "Service role is required." as const, brand: null, account: null, url: null };

  const ensured = await ensureStudioBrand(supabase, profile);
  if (!ensured.brand) return { error: ensured.error || "Could not load brand.", brand: null, account: null, url: null };

  const brand = ensured.brand;
  let accountId = typeof brand.stripe_connect_id === "string" ? brand.stripe_connect_id : "";

  if (!accountId) {
    const created = await stripe.v2.core.accounts.create({
      contact_email: profile.email ?? undefined,
      display_name: String(brand.name || profile.full_name || "Syllis brand"),
      dashboard: "express",
      defaults: {
        currency: "gbp",
        responsibilities: {
          fees_collector: "application",
          losses_collector: "application",
        },
        profile: {
          doing_business_as: String(brand.name || profile.full_name || "Syllis brand"),
          product_description: "Independent clothing sold through Syllis.",
        },
      },
      identity: {
        country: "GB",
      },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { requested: true },
            },
          },
        },
      },
      include: ["configuration.recipient", "identity", "requirements"],
      metadata: {
        syllis_user_id: profile.id,
        syllis_brand_id: String(brand.id),
      },
    });
    accountId = created.id;
    const { error } = await supabase
      .from(T.brands)
      .update({ stripe_connect_id: accountId, payouts_ready: false })
      .eq("id", brand.id);
    if (error && isMissingColumn(error)) {
      return { error: ORDERS_SQL_HINT, brand, account: created, url: null };
    }
  }

  const account = await retrieveConnectAccount(stripe, accountId);
  const ready = await syncBrandPayouts(String(brand.id), account);

  if (ready) {
    const login = await stripe.accounts.createLoginLink(accountId);
    return { error: null, brand, account, url: login.url, ready: true as const };
  }

  const url = await createOnboardingLink(stripe, accountId);
  return { error: null, brand, account, url, ready: false as const };
}

export async function brandSaleState(brandSlug: string | null | undefined) {
  if (!brandSlug) return { sellable: false, payoutsReady: false, connectId: null as string | null, brandId: null as string | null };
  const supabase = createServiceClient();
  if (!supabase) return { sellable: false, payoutsReady: false, connectId: null, brandId: null };
  const { data, error } = await supabase
    .from(T.brands)
    .select("id, stripe_connect_id, payouts_ready, live")
    .eq("slug", brandSlug)
    .maybeSingle();
  if (error || !data) {
    return { sellable: false, payoutsReady: false, connectId: null, brandId: null };
  }
  const payoutsReady = Boolean(data.payouts_ready) && Boolean(data.stripe_connect_id);
  return {
    sellable: Boolean(data.live) && payoutsReady && paymentsLive(),
    payoutsReady,
    connectId: (data.stripe_connect_id as string | null) ?? null,
    brandId: String(data.id),
  };
}

export function sellerPlanFromProfile(plan: PlanId) {
  return isBrandPlan(plan) ? plan : "starter";
}
