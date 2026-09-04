import { NextResponse } from "next/server";
import { getProfile, requireAdmin } from "@/lib/auth";
import { T } from "@/lib/tables";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function db() {
  return createServiceClient() ?? (await createClient());
}

export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ items: [] });

  if (profile.role === "admin") {
    const adminDb = (await db()) ?? supabase;
    const { data } = await adminDb.from(T.applications).select("*").order("created_at", { ascending: false });
    return NextResponse.json({ items: data ?? [] });
  }

  const { data } = await supabase
    .from(T.applications)
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ items: data ?? [] });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = (await request.json()) as {
    id?: string;
    status?: "approved" | "rejected";
    founding_brand?: boolean;
    note?: string;
  };
  if (!body.id || (body.status !== "approved" && body.status !== "rejected")) {
    return NextResponse.json({ error: "id and status required." }, { status: 400 });
  }

  const supabase = await db();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const { data: application, error } = await supabase
    .from(T.applications)
    .update({
      status: body.status,
      admin_note: body.note ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", body.id)
    .select("*")
    .single();

  if (error || !application) {
    return NextResponse.json({ error: error?.message || "Not found." }, { status: 400 });
  }

  const verified = body.status === "approved";
  const updates: Record<string, unknown> = {
    verification_status: verified ? "verified" : "rejected",
    brand_status: application.kind === "brand" ? (verified ? "active" : "rejected") : undefined,
  };
  if (application.kind === "brand" && verified && body.founding_brand) {
    updates.founding_brand = true;
    updates.founding_started_at = new Date().toISOString();
  }

  await supabase.from(T.profiles).update(updates).eq("id", application.user_id);

  return NextResponse.json({ application });
}
