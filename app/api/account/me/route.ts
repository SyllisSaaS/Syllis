import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";

export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  return NextResponse.json({
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
  });
}
