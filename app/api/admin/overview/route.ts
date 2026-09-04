import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { aggregateEvents, compareStats, delta, lastDayKeys, pct } from "@/lib/analytics";
import { getLiveCatalogue } from "@/lib/catalogue";
import { isBrandPlan, isPlanId } from "@/lib/plans";
import { T } from "@/lib/tables";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function db() {
  return createServiceClient() ?? (await createClient());
}

function dayKey(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

async function liveEvents(
  supabase: NonNullable<Awaited<ReturnType<typeof db>>>,
  startIso: string,
  endIso?: string
) {
  let query = supabase
    .from(T.events)
    .select("id, name, created_at, brand_slug, product_id, user_id, path")
    .is("archive_batch_id", null)
    .gte("created_at", startIso)
    .limit(8000);
  if (endIso) query = query.lt("created_at", endIso);
  const first = await query;
  if (!first.error) return first.data ?? [];
  if (!(first.error.message || "").toLowerCase().includes("archive_batch_id")) {
    return [];
  }

  let fallback = supabase
    .from(T.events)
    .select("id, name, created_at, brand_slug, product_id, user_id, path")
    .gte("created_at", startIso)
    .limit(8000);
  if (endIso) fallback = fallback.lt("created_at", endIso);
  const second = await fallback;
  return second.data ?? [];
}

function emptyPayload(days: number) {
  return {
    configured: false,
    rangeDays: days,
    income: { totalPence: 0, monthPence: 0, currency: "gbp" },
    counts: { shoppers: 0, brands: 0, stylists: 0, pending: 0, openReports: 0 },
    ledger: [],
    series: [],
    byRole: [],
    bySource: [],
    byPlan: [],
    verification: [],
    brandStatus: [],
    events: { views: 0, saves: 0, clicks: 0, uniqueUsers: 0 },
    funnel: [],
    heatmap: [],
    weekday: [],
    hours: [],
    eventMix: [],
    topBrands: [],
    rates: { saveRate: 0, ctr: 0, viewsPerSignup: 0 },
    deltas: null,
    people: [],
  };
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("days") ?? "30");
  const days = [7, 30, 90].includes(requested) ? requested : 30;

  const supabase = await db();
  if (!supabase) return NextResponse.json(emptyPayload(days));

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);
  const previousFrom = new Date(from);
  previousFrom.setDate(previousFrom.getDate() - days);
  const previousTo = new Date(from);
  previousTo.setMilliseconds(-1);

  const [
    { data: ledgerPreview },
    { data: ledgerAll },
    { data: profiles },
    { count: pending },
    { count: openReports },
  ] = await Promise.all([
    supabase.from(T.ledger).select("*").order("occurred_at", { ascending: false }).limit(50),
    supabase.from(T.ledger).select("amount_pence, occurred_at, source"),
    supabase
      .from(T.profiles)
      .select("id, role, verification_status, brand_status, plan, email, full_name, brand_slug, founding_brand, created_at"),
    supabase.from(T.applications).select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from(T.reports).select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);

  const events = await liveEvents(supabase, from.toISOString());
  const previousEvents = await liveEvents(supabase, previousFrom.toISOString(), from.toISOString());

  const totals = ledgerAll ?? [];
  const totalPence = totals.reduce((sum, row) => sum + (row.amount_pence as number), 0);
  const monthPence = totals
    .filter((row) => new Date(row.occurred_at as string) >= start)
    .reduce((sum, row) => sum + (row.amount_pence as number), 0);

  const people = profiles ?? [];
  const eventRows = (events ?? []) as Parameters<typeof aggregateEvents>[0];
  const previousRows = (previousEvents ?? []) as Parameters<typeof aggregateEvents>[0];
  const keys = lastDayKeys(days);
  const previousKeys = lastDayKeys(days, previousTo);
  const stats = aggregateEvents(eventRows, keys);
  const previousStats = aggregateEvents(previousRows, previousKeys);
  const compared = compareStats(stats, previousStats);

  const incomeByDay = (iso: string) =>
    totals
      .filter((row) => dayKey(row.occurred_at as string) === iso)
      .reduce((sum, row) => sum + (row.amount_pence as number) / 100, 0);

  const signupsByDay = (iso: string) =>
    people.filter((p) => p.created_at && dayKey(p.created_at) === iso).length;

  const previousIncome = keys.reduce((sum, iso, index) => {
    const prevIso = previousKeys[index];
    return sum + (prevIso ? incomeByDay(prevIso) : 0);
  }, 0);
  const currentIncome = keys.reduce((sum, iso) => sum + incomeByDay(iso), 0);
  const currentSignups = keys.reduce((sum, iso) => sum + signupsByDay(iso), 0);
  const previousSignups = previousKeys.reduce((sum, iso) => sum + signupsByDay(iso), 0);

  const series = stats.series.map((row, index) => ({
    date: row.date,
    iso: row.iso,
    income: incomeByDay(row.iso),
    signups: signupsByDay(row.iso),
    views: row.views,
    saves: row.saves,
    clicks: row.clicks,
    reserves: row.reserves,
    maViews: row.maViews,
    viewsPrev: compared.series[index]?.viewsPrev ?? 0,
    incomePrev: previousKeys[index] ? incomeByDay(previousKeys[index]) : 0,
    signupsPrev: previousKeys[index] ? signupsByDay(previousKeys[index]) : 0,
  }));

  const byRole = [
    { name: "Shoppers", value: people.filter((p) => p.role === "shopper").length },
    { name: "Brands", value: people.filter((p) => p.role === "brand").length },
    { name: "Stylists", value: people.filter((p) => p.role === "stylist").length },
    { name: "Admin", value: people.filter((p) => p.role === "admin").length },
  ].filter((row) => row.value > 0);

  const sourceMap = new Map<string, number>();
  for (const row of totals) {
    const key = (row.source as string) || "other";
    sourceMap.set(key, (sourceMap.get(key) ?? 0) + (row.amount_pence as number) / 100);
  }
  const bySource = [...sourceMap.entries()].map(([name, value]) => ({ name, value }));

  const planMap = new Map<string, number>();
  for (const person of people) {
    if (person.role === "admin") continue;
    const key = (person.plan as string) || "free";
    planMap.set(key, (planMap.get(key) ?? 0) + 1);
  }

  const verificationMap = new Map<string, number>();
  for (const person of people.filter((p) => p.role === "brand" || p.role === "stylist")) {
    const key = (person.verification_status as string) || "unverified";
    verificationMap.set(key, (verificationMap.get(key) ?? 0) + 1);
  }

  const brandStatusMap = new Map<string, number>();
  for (const person of people.filter((p) => p.role === "brand")) {
    const key = (person.brand_status as string) || "pending";
    brandStatusMap.set(key, (brandStatusMap.get(key) ?? 0) + 1);
  }
  const { brands: catalogueBrands } = await getLiveCatalogue();

  return NextResponse.json({
    configured: true,
    rangeDays: days,
    income: { totalPence, monthPence, currency: "gbp" },
    counts: {
      shoppers: people.filter((p) => p.role === "shopper").length,
      brands: people.filter((p) => p.role === "brand").length,
      stylists: people.filter((p) => p.role === "stylist").length,
      pending: pending ?? 0,
      openReports: openReports ?? 0,
    },
    people,
    ledger: ledgerPreview ?? [],
    series,
    byRole,
    bySource,
    byPlan: [...planMap.entries()].map(([name, value]) => ({ name, value })),
    verification: [...verificationMap.entries()].map(([name, value]) => ({ name, value })),
    brandStatus: [...brandStatusMap.entries()].map(([name, value]) => ({ name, value })),
    events: {
      views: stats.productViews,
      saves: stats.saves,
      clicks: stats.clicks,
      uniqueUsers: stats.uniqueUsers,
    },
    funnel: stats.funnel,
    heatmap: stats.heatmap,
    weekday: stats.weekday,
    hours: stats.hours,
    eventMix: stats.eventMix,
    topBrands: stats.topBrands.map((row) => ({
      ...row,
      name: catalogueBrands.find((brand) => brand.slug === row.slug)?.name ?? row.slug,
    })),
    rates: {
      saveRate: stats.saveRate,
      ctr: stats.ctr,
      viewsPerSignup: currentSignups === 0 ? 0 : Math.round((stats.views / currentSignups) * 10) / 10,
      conversion: pct(stats.clicks, stats.views),
    },
    deltas: {
      views: compared.views,
      saves: compared.saves,
      clicks: compared.clicks,
      income: delta(currentIncome, previousIncome),
      signups: delta(currentSignups, previousSignups),
    },
  });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const body = (await request.json()) as {
    userId?: string;
    brand_status?: string;
    verification_status?: string;
    founding_brand?: boolean;
    role?: string;
    plan?: string;
  };
  if (!body.userId) return NextResponse.json({ error: "userId required." }, { status: 400 });

  const supabase = await db();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const updates: Record<string, unknown> = {};
  if (body.brand_status) updates.brand_status = body.brand_status;
  if (body.verification_status) updates.verification_status = body.verification_status;
  if (typeof body.founding_brand === "boolean") {
    updates.founding_brand = body.founding_brand;
    if (body.founding_brand) updates.founding_started_at = new Date().toISOString();
  }
  if (body.role === "shopper" || body.role === "brand" || body.role === "stylist" || body.role === "admin") {
    updates.role = body.role;
  }
  if (isPlanId(body.plan) && (body.plan === "free" || body.plan === "early" || isBrandPlan(body.plan))) {
    updates.plan = body.plan;
  }

  const { error } = await supabase.from(T.profiles).update(updates).eq("id", body.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service role is required to remove accounts." }, { status: 503 });
  }

  const body = (await request.json()) as { userId?: string; email?: string };
  let userId = body.userId?.trim() || "";
  if (!userId && body.email) {
    const { data } = await supabase.from(T.profiles).select("id").eq("email", body.email).maybeSingle();
    userId = (data?.id as string | undefined) ?? "";
  }
  if (!userId) return NextResponse.json({ error: "userId required." }, { status: 400 });
  if (userId === admin.id) {
    return NextResponse.json({ error: "You cannot remove your own admin account." }, { status: 400 });
  }

  const { data: profile } = await supabase.from(T.profiles).select("id, role, email").eq("id", userId).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (profile.role === "admin") {
    return NextResponse.json({ error: "Admin accounts cannot be removed from here." }, { status: 400 });
  }

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, removed: profile.email || userId });
}
