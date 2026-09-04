import type { Look } from "./look";
import {
  getEntitlements,
  isBrandPlan,
  isPlanId,
  isTrialActive,
  type AccountRole,
  type PlanId,
} from "./plans";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  name?: string | null;
  username: string | null;
  role: AccountRole;
  plan: PlanId;
  look: Look | null;
  brand_slug: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  verification_status: VerificationStatus;
  founding_brand: boolean;
  founding_member: boolean;
  founding_started_at: string | null;
  email_confirmed: boolean;
  created_at: string | null;
};

export function normalizePlan(value: unknown): PlanId {
  return isPlanId(value) ? value : "free";
}

export function normalizeRole(value: unknown, plan?: PlanId): AccountRole {
  if (value === "shopper" || value === "brand" || value === "stylist" || value === "admin") {
    return value;
  }
  if (plan && isBrandPlan(plan)) return "brand";
  return "shopper";
}

export function normalizeVerification(value: unknown): VerificationStatus {
  if (value === "pending" || value === "verified" || value === "rejected" || value === "unverified") {
    return value;
  }
  return "unverified";
}

export function membershipActive(profile: Pick<Profile, "plan" | "subscription_status" | "trial_ends_at">) {
  if (profile.plan === "free") return true;
  const status = profile.subscription_status;
  if (status === "active" || status === "trialing") return true;
  if (isTrialActive(profile.trial_ends_at)) return true;
  return false;
}

export function effectivePlan(profile: Pick<Profile, "plan" | "role" | "subscription_status" | "trial_ends_at">): PlanId {
  if (membershipActive(profile)) return normalizePlan(profile.plan);
  if (profile.role === "brand") return "starter";
  return "free";
}

export function profileEntitlements(profile: Profile) {
  if (profile.role === "admin") {
    return {
      plan: "premium" as PlanId,
      active: true,
      readOnly: false,
      entitlements: getEntitlements("premium"),
    };
  }
  const plan = effectivePlan(profile);
  const entitlements = getEntitlements(plan);
  const active = membershipActive(profile);
  return {
    plan,
    active,
    readOnly: entitlements.readOnlyWhenLapsed && !active,
    entitlements,
  };
}

export function requestedAccountRole(value: unknown): Exclude<AccountRole, "admin"> {
  if (value === "brand" || value === "stylist" || value === "shopper") return value;
  return "shopper";
}
