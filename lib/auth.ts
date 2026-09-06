import { createClient } from "@/lib/supabase/server";
import { T } from "@/lib/tables";
import { isLook } from "@/lib/look";
import {
  normalizePlan,
  normalizeRole,
  normalizeVerification,
  type Profile,
} from "@/lib/profile";
import { clampFocus } from "@/lib/appearance";

export async function getAuthUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export function mapProfile(
  user: { id: string; email?: string | null; created_at?: string; email_confirmed_at?: string | null; user_metadata?: Record<string, unknown> },
  data: Record<string, unknown> | null
): Profile {
  const plan = normalizePlan(data?.plan ?? "free");
  const role = normalizeRole(data?.role, plan);
  return {
    id: user.id,
    email: (data?.email as string | null) ?? user.email ?? null,
    full_name:
      (data?.full_name as string | null) ??
      (data?.name as string | null) ??
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null,
    name:
      (data?.name as string | null) ??
      (data?.full_name as string | null) ??
      (user.user_metadata?.name as string | undefined) ??
      null,
    username: (data?.username as string | null) ?? (user.user_metadata?.username as string | undefined) ?? null,
    role,
    plan,
    look: isLook(data?.look) ? data.look : null,
    brand_slug: (data?.brand_slug as string | null) ?? null,
    stripe_customer_id: (data?.stripe_customer_id as string | null) ?? null,
    stripe_subscription_id: (data?.stripe_subscription_id as string | null) ?? null,
    subscription_status: (data?.subscription_status as string | null) ?? null,
    trial_ends_at: (data?.trial_ends_at as string | null) ?? null,
    verification_status: normalizeVerification(data?.verification_status),
    founding_brand: Boolean(data?.founding_brand),
    founding_member: Boolean(data?.founding_member),
    founding_started_at: (data?.founding_started_at as string | null) ?? null,
    email_confirmed: Boolean(user.email_confirmed_at),
    created_at: (data?.created_at as string | null) ?? user.created_at ?? null,
    avatar_url: (data?.avatar_url as string | null) ?? null,
    avatar_x: clampFocus(data?.avatar_x),
    avatar_y: clampFocus(data?.avatar_y),
    bio: (data?.bio as string | null) ?? null,
  };
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from(T.profiles).select("*").eq("id", user.id).maybeSingle();
  return mapProfile(user, data);
}

export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") return null;
  return profile;
}
