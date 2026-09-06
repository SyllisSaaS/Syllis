import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProfile } from "@/lib/auth";
import { canUseStudio, profileEntitlements } from "@/lib/profile";
import { StudioAds } from "@/components/studio-ads";
import { StudioPlan } from "@/components/studio-plan";
import { StudioProfile } from "@/components/studio-profile";
import { StudioProducts } from "@/components/studio-products";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ ad?: string; welcome?: string }>;
}) {
  const profile = await getProfile();
  const { ad, welcome } = await searchParams;

  if (!profile) {
    return (
      <div className="page-shell section-space">
        <p className="eyebrow mb-4">Brand studio</p>
        <h1 className="text-5xl font-semibold tracking-[-.06em]">Log in as a brand.</h1>
        <p className="mt-4 max-w-md text-sm text-[color:var(--muted)]">
          Studio is for labels listing on Syllis. Shoppers can keep using Discover.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="button button-dark">
            Log in <ArrowRight size={14} />
          </Link>
          <Link href="/signup?role=brand" className="button button-quiet">
            Create brand account
          </Link>
        </div>
      </div>
    );
  }

  if (!canUseStudio(profile)) {
    return (
      <div className="page-shell section-space">
        <p className="eyebrow mb-4">Brand studio</p>
        <h1 className="text-5xl font-semibold tracking-[-.06em]">This space is for labels.</h1>
        <p className="mt-4 max-w-md text-sm text-[color:var(--muted)]">
          Your account is a shopper account. Create a brand account to see analytics.
        </p>
        <Link href="/signup?role=brand" className="button button-dark mt-8">
          Sign up as a brand <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const access = profileEntitlements(profile);

  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-4">Brand studio</p>
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-[clamp(48px,7vw,88px)] font-semibold leading-[.86] tracking-[-.07em]">
            {profile.full_name || profile.brand_slug || "Your label"}
          </h1>
          <p className="mt-4 max-w-xl text-sm text-[color:var(--muted)]">
            {access.entitlements.name} plan is live on this account
            {profile.founding_brand ? " · founding brand" : ""}
            . Payments are paused, so nothing will be charged. Set your public look, upload pieces,
            then check how they perform.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/studio/analytics" className="button button-dark">
            Open analytics <ArrowRight size={14} />
          </Link>
          {profile.founding_brand ? (
            <p className="text-xs text-[color:var(--muted)]">Founding year is reserved on this account.</p>
          ) : null}
        </div>
      </div>

      {welcome && (
        <p className="mt-8 border hairline p-4 text-sm">
          Welcome. Start with a profile photo and banner, then add your first piece. Shoppers will only see
          what you mark as live.
        </p>
      )}
      {ad === "success" && (
        <p className="mt-8 text-sm">Ad payment received. It goes live when the webhook confirms — usually a few seconds.</p>
      )}
      {ad === "cancel" && <p className="mt-8 text-sm text-[color:var(--muted)]">Checkout was cancelled. Nothing was charged.</p>}

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <div className="panel border hairline p-6">
          <p className="eyebrow">Listings</p>
          <p className="mt-4 text-3xl font-semibold">{access.entitlements.productCap ?? "—"}</p>
          <p className="mt-2 text-xs text-[color:var(--muted)]">Product cap on this plan</p>
        </div>
        <div className="panel border hairline p-6">
          <p className="eyebrow">Analytics</p>
          <p className="mt-4 text-3xl font-semibold capitalize">{access.entitlements.fidelity}</p>
          <p className="mt-2 text-xs text-[color:var(--muted)]">
            {access.entitlements.fidelity === "plain" && "Written summary and a simple bar log"}
            {access.entitlements.fidelity === "basic" && "Stat cards, bar or line, date range"}
            {access.entitlements.fidelity === "advanced" && "Funnels, heatmaps, comparison, export"}
          </p>
        </div>
        <div className="panel border hairline p-6">
          <p className="eyebrow">Early drops</p>
          <p className="mt-4 text-3xl font-semibold">{access.entitlements.earlyAccess ? "Yes" : "No"}</p>
          <p className="mt-2 text-xs text-[color:var(--muted)]">Early-access controls</p>
        </div>
      </div>

      <div className="mt-12">
        <StudioPlan current={access.plan} />
      </div>

      <div className="mt-8">
        <StudioProfile customBanner={access.entitlements.customBanner} />
      </div>

      <div className="mt-8">
        <StudioProducts />
      </div>

      <div className="mt-12">
        <StudioAds defaultBrand={profile.full_name || profile.brand_slug || "Your label"} />
      </div>

      <div className="mt-12">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}
