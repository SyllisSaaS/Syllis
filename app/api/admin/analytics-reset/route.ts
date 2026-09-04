import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { T } from "@/lib/tables";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function db() {
  return createServiceClient() ?? (await createClient());
}

function missingResetTables(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const message = (error.message || "").toLowerCase();
  return (
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    message.includes("archive_batch_id") ||
    message.includes("syllis_analytics_resets") ||
    message.includes("does not exist") ||
    message.includes("could not find")
  );
}

const SQL_HINT =
  "Paste supabase/analytics-reset.sql in the Supabase SQL editor, then try again.";

function bounds(from: string, to: string) {
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }
  return { start, end };
}

export type ResetBatch = {
  id: string;
  from_at: string;
  to_at: string;
  event_count: number;
  created_at: string;
  restored_at: string | null;
};

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const supabase = await db();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  const range = from && to ? bounds(from, to) : null;

  const batchesRes = await supabase
    .from(T.analyticsResets)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);

  if (missingResetTables(batchesRes.error)) {
    return NextResponse.json({ ready: false, hint: SQL_HINT, pending: 0, batches: [] });
  }

  const batches = (batchesRes.data ?? []) as ResetBatch[];
  let pending = 0;
  if (range) {
    const { count, error } = await supabase
      .from(T.events)
      .select("id", { count: "exact", head: true })
      .is("archive_batch_id", null)
      .gte("created_at", range.start.toISOString())
      .lt("created_at", range.end.toISOString());
    if (missingResetTables(error)) {
      return NextResponse.json({ ready: false, hint: SQL_HINT, pending: 0, batches });
    }
    pending = count ?? 0;
  }

  return NextResponse.json({
    ready: true,
    pending,
    batches,
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const supabase = await db();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  let body: { action?: string; from?: string; to?: string; batchId?: string };
  try {
    body = (await request.json()) as { action?: string; from?: string; to?: string; batchId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (body.action === "restore") {
    const batchId = String(body.batchId ?? "").trim();
    if (!batchId) return NextResponse.json({ error: "batchId required." }, { status: 400 });

    const { data: batch, error: found } = await supabase
      .from(T.analyticsResets)
      .select("*")
      .eq("id", batchId)
      .maybeSingle();
    if (missingResetTables(found)) {
      return NextResponse.json({ error: SQL_HINT }, { status: 400 });
    }
    if (!batch) return NextResponse.json({ error: "Nothing to restore." }, { status: 404 });
    if (batch.restored_at) {
      return NextResponse.json({ error: "That batch is already restored." }, { status: 400 });
    }

    const { error: putBack } = await supabase
      .from(T.events)
      .update({ archive_batch_id: null })
      .eq("archive_batch_id", batchId);
    if (putBack) return NextResponse.json({ error: putBack.message }, { status: 400 });

    await supabase
      .from(T.analyticsResets)
      .update({ restored_at: new Date().toISOString() })
      .eq("id", batchId);

    return NextResponse.json({
      ok: true,
      restored: batch.event_count,
      message: `Restored ${batch.event_count} events to the charts.`,
    });
  }

  if (body.action !== "reset") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const range = bounds(String(body.from ?? ""), String(body.to ?? ""));
  if (!range) return NextResponse.json({ error: "Pick a valid from and to date." }, { status: 400 });

  const { count, error: countError } = await supabase
    .from(T.events)
    .select("id", { count: "exact", head: true })
    .is("archive_batch_id", null)
    .gte("created_at", range.start.toISOString())
    .lt("created_at", range.end.toISOString());

  if (missingResetTables(countError)) {
    return NextResponse.json({ error: SQL_HINT }, { status: 400 });
  }

  const eventCount = count ?? 0;
  if (eventCount === 0) {
    return NextResponse.json({ error: "No live events in that range." }, { status: 400 });
  }

  const { data: batch, error: insertError } = await supabase
    .from(T.analyticsResets)
    .insert({
      from_at: range.start.toISOString(),
      to_at: new Date(range.end.getTime() - 1).toISOString(),
      event_count: eventCount,
    })
    .select("*")
    .single();

  if (insertError || !batch) {
    return NextResponse.json({ error: insertError?.message || SQL_HINT }, { status: 400 });
  }

  const { error: hideError } = await supabase
    .from(T.events)
    .update({ archive_batch_id: batch.id })
    .is("archive_batch_id", null)
    .gte("created_at", range.start.toISOString())
    .lt("created_at", range.end.toISOString());

  if (hideError) {
    await supabase.from(T.analyticsResets).delete().eq("id", batch.id);
    return NextResponse.json({ error: hideError.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    hidden: eventCount,
    batchId: batch.id,
    message: `Hid ${eventCount} events. Restore from Overview if that was a mistake.`,
  });
}
