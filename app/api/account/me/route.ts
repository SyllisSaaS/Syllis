import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { APPEARANCE_SQL_HINT, clampFocus, isMissingColumn } from "@/lib/appearance";
import { paymentsLive } from "@/lib/billing";
import { isBrandPlan } from "@/lib/plans";
import { T } from "@/lib/tables";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

function payload(profile: NonNullable<Awaited<ReturnType<typeof getProfile>>>) {
  return {
    id: profile.id,
    name: profile.name ?? profile.full_name,
    username: profile.username,
    email: profile.email,
    plan: profile.plan,
    role: profile.role,
    trial_ends_at: profile.trial_ends_at,
    subscription_status: profile.subscription_status,
    verification_status: profile.verification_status,
    founding_brand: profile.founding_brand,
    founding_member: profile.founding_member,
    created_at: profile.created_at,
    avatar_url: profile.avatar_url,
    avatar_x: profile.avatar_x,
    avatar_y: profile.avatar_y,
    bio: profile.bio,
    brand_slug: profile.brand_slug,
    founding_status: profile.founding_brand ? "approved" : "none",
    payments: paymentsLive(),
  };
}

export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  return NextResponse.json(payload(profile));
}

export async function PATCH(request: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Log in first." }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim().slice(0, 80);
    patch.name = name;
    patch.full_name = name;
  }
  if (typeof body.username === "string") {
    patch.username = body.username.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 32) || null;
  }
  if (typeof body.bio === "string") {
    patch.bio = body.bio.trim().slice(0, 280);
  }
  if (typeof body.avatar_url === "string" || body.avatar_url === null) {
    patch.avatar_url = body.avatar_url;
  }
  if (body.avatar_x != null) patch.avatar_x = clampFocus(body.avatar_x);
  if (body.avatar_y != null) patch.avatar_y = clampFocus(body.avatar_y);
  if (!paymentsLive() && isBrandPlan(body.plan) && (profile.role === "brand" || profile.role === "admin")) {
    patch.plan = body.plan;
    patch.subscription_status = "active";
  }

  const db = createServiceClient() ?? (await createClient());
  if (!db) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const { error } = await db.from(T.profiles).update(patch).eq("id", profile.id);
  if (error) {
    return NextResponse.json(
      { error: isMissingColumn(error) ? APPEARANCE_SQL_HINT : error.message, needsSql: isMissingColumn(error) },
      { status: 400 }
    );
  }

  const next = await getProfile();
  if (!next) return NextResponse.json({ error: "Saved, but profile could not be reloaded." }, { status: 400 });
  return NextResponse.json(payload(next));
}
