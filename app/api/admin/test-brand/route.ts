import { NextResponse } from "next/server";
import { adminEmail, isAdminEmail } from "@/lib/env";
import { requireAdmin } from "@/lib/auth";
import { T } from "@/lib/tables";
import { createServiceClient } from "@/lib/supabase/service";

function plusAlias(email: string, tag: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return `brand.${tag}@syllis.local`;
  return `${local}+${tag}@${domain}`;
}

function password() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `SyllisBrand-${n}`;
}

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Service role key is required to create a test brand." },
      { status: 503 }
    );
  }

  const tag = `brand${Date.now().toString(36)}`;
  const email = plusAlias(admin.email || adminEmail() || "oliverday015@gmail.com", tag);
  const pass = password();
  const slug = `test-${tag}`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: pass,
    email_confirm: true,
    user_metadata: {
      full_name: "Test Label",
      role: "brand",
      plan: "growth",
      brand_slug: slug,
      founding_brand: true,
    },
  });

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message || "Could not create auth user." }, { status: 400 });
  }

  const { error: profileError } = await supabase.from(T.profiles).upsert(
    {
      id: data.user.id,
      email,
      full_name: "Test Label",
      name: "Test Label",
      role: "brand",
      plan: "growth",
      brand_slug: slug,
      verification_status: "verified",
      brand_status: "active",
      founding_brand: true,
      founding_started_at: new Date().toISOString(),
      subscription_status: "trialing",
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({
    email,
    password: pass,
    brandSlug: slug,
    userId: data.user.id,
    hint: isAdminEmail(email)
      ? "This alias still hits your inbox if you use Gmail."
      : "Log in with these details in a private window.",
  });
}
