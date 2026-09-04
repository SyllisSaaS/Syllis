import { NextResponse } from "next/server";
import { getProfile, requireAdmin } from "@/lib/auth";
import { T } from "@/lib/tables";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Log in to report." }, { status: 401 });

  const body = (await request.json()) as {
    targetType?: string;
    targetId?: string;
    reason?: string;
    details?: string;
  };
  const allowed = ["brand", "user", "product", "stylist", "drop"];
  if (!body.targetType || !allowed.includes(body.targetType) || !body.targetId || !body.reason) {
    return NextResponse.json({ error: "targetType, targetId and reason are required." }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const { error } = await supabase.from(T.reports).insert({
    reporter_id: profile.id,
    target_type: body.targetType,
    target_id: body.targetId,
    reason: body.reason.slice(0, 200),
    details: body.details?.slice(0, 2000) ?? null,
    status: "open",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const supabase = createServiceClient() ?? (await createClient());
  if (!supabase) return NextResponse.json({ items: [] });
  const { data } = await supabase.from(T.reports).select("*").order("created_at", { ascending: false });
  return NextResponse.json({ items: data ?? [] });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const body = (await request.json()) as { id?: string; status?: string };
  if (!body.id || !body.status) return NextResponse.json({ error: "id and status required." }, { status: 400 });
  const supabase = createServiceClient() ?? (await createClient());
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  const resolved = ["resolved", "dismissed"].includes(body.status) ? new Date().toISOString() : null;
  const { error } = await supabase
    .from(T.reports)
    .update({ status: body.status, resolved_at: resolved })
    .eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
