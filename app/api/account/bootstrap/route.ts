import { NextResponse } from "next/server";
import { getAuthUser, getProfile, mapProfile } from "@/lib/auth";
import { isAdminEmail } from "@/lib/env";
import { DEFAULT_LOOK, isLook } from "@/lib/look";
import { isBrandPlan, trialEndDate } from "@/lib/plans";
import { requestedAccountRole } from "@/lib/profile";
import { T } from "@/lib/tables";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const meta = user.user_metadata ?? {};
  const db = createServiceClient() ?? (await createClient());
  if (!db) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  const { data: existing } = await db.from(T.profiles).select("*").eq("id", user.id).maybeSingle();
  const admin = isAdminEmail(user.email);

  if (existing) {
    const repairs: Record<string, unknown> = {};
    if (admin && existing.role !== "admin") {
      repairs.role = "admin";
      repairs.verification_status = "verified";
    }
    if (existing.role === "brand" && existing.verification_status !== "verified") {
      repairs.verification_status = "verified";
      repairs.brand_status = "active";
    }
    if (existing.role === "brand" && !existing.subscription_status) {
      repairs.subscription_status = "active";
    }
    const look = isLook(body.look) ? body.look : null;
    if (look && !existing.look) repairs.look = look;
    if (Object.keys(repairs).length) {
      await db.from(T.profiles).update(repairs).eq("id", user.id);
    }
    const { data: refreshed } = await db.from(T.profiles).select("*").eq("id", user.id).maybeSingle();
    const profile = mapProfile(user, refreshed);
    return NextResponse.json({
      role: profile.role,
      verification_status: profile.verification_status,
      needsEmail: !user.email_confirmed_at,
      existing: true,
    });
  }

  const requested = requestedAccountRole(body.role ?? meta.role);
  const role = admin ? "admin" : requested;
  const look = isLook(body.look) ? body.look : isLook(meta.look) ? meta.look : DEFAULT_LOOK;
  const brandSlug =
    typeof body.brand_slug === "string"
      ? body.brand_slug
      : typeof meta.brand_slug === "string"
        ? meta.brand_slug
        : null;
  const requestedPlan = body.plan ?? meta.plan;
  const plan =
    role === "brand" && isBrandPlan(requestedPlan)
      ? requestedPlan
      : role === "admin"
        ? "premium"
        : "free";
  const wantsFounding = role === "brand" && (body.founding_brand === true || meta.founding_brand === true);
  const foundingMember =
    (role === "shopper" && (body.founding_member === true || meta.founding_member === true)) || role === "admin";
  const acceptedLegal = body.accepted_legal === true || meta.accepted_legal === true;
  if (!acceptedLegal) {
    return NextResponse.json(
      { error: "Accept the Terms of use and Privacy policy to create an account." },
      { status: 400 }
    );
  }
  const acceptedAt = new Date().toISOString();
  const fullName =
    typeof body.full_name === "string"
      ? body.full_name
      : typeof meta.full_name === "string"
        ? meta.full_name
        : user.user_metadata?.name ?? null;

  const profile = {
    id: user.id,
    email: user.email,
    full_name: fullName,
    name: fullName,
    role,
    plan,
    look,
    brand_slug: brandSlug,
    verification_status: role === "stylist" ? "pending" : "verified",
    brand_status: role === "brand" ? "active" : "pending",
    founding_brand: false,
    founding_member: foundingMember,
    founding_started_at: foundingMember ? new Date().toISOString() : null,
    trial_ends_at: role === "brand" ? trialEndDate().toISOString() : null,
    subscription_status: role === "brand" ? "active" : null,
    terms_accepted_at: acceptedAt,
    privacy_accepted_at: acceptedAt,
  };

  const { error } = await db.from(T.profiles).upsert(profile, { onConflict: "id" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (role === "stylist" || wantsFounding) {
    const kind = role === "stylist" ? "stylist" : "brand";
    const { data: open } = await db
      .from(T.applications)
      .select("id")
      .eq("user_id", user.id)
      .eq("kind", kind)
      .eq("status", "pending")
      .maybeSingle();
    if (!open) {
      await db.from(T.applications).insert({
        user_id: user.id,
        kind,
        status: "pending",
        payload: {
          purpose: wantsFounding ? "founding" : "stylist",
          full_name: profile.full_name,
          brand_name: body.brand_name ?? meta.brand_name ?? profile.full_name,
          brand_slug: brandSlug,
          plan,
          email: user.email,
          phone: body.phone ?? meta.phone ?? null,
          instagram: body.instagram ?? meta.instagram ?? null,
          website: body.website ?? body.portfolio ?? meta.website ?? meta.portfolio ?? null,
          bio: body.bio ?? meta.bio ?? null,
        },
      });
    }
  }

  return NextResponse.json({
    role,
    verification_status: profile.verification_status,
    needsEmail: !user.email_confirmed_at,
    existing: false,
  });
}

export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ role: null });
  return NextResponse.json({
    role: profile.role,
    verification_status: profile.verification_status,
    email_confirmed: profile.email_confirmed,
    founding_brand: profile.founding_brand,
    founding_member: profile.founding_member,
  });
}
