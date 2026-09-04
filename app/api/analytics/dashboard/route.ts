import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { aggregateEvents, compareStats, lastDayKeys } from "@/lib/analytics";
import { getLayout, listEvents, setLayout } from "@/lib/store";
import { ALL_WIDGETS, type ChartType, type WidgetId } from "@/lib/plans";
import { profileEntitlements } from "@/lib/profile";
import { getLiveCatalogue } from "@/lib/catalogue";

function parseRange(days: number, end = new Date()) {
  const to = new Date(end);
  const from = new Date(end);
  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

export async function GET(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }
  if (profile.role !== "brand" && profile.role !== "admin") {
    return NextResponse.json({ error: "Brand analytics are for brand accounts." }, { status: 403 });
  }

  const access = profileEntitlements(profile);
  const url = new URL(request.url);
  const requestedDays = Number(url.searchParams.get("days") ?? "30");
  const days = access.entitlements.dateRange
    ? [7, 30, 90].includes(requestedDays)
      ? requestedDays
      : 30
    : 30;
  const { from, to } = parseRange(days);
  const previousTo = new Date(from);
  previousTo.setMilliseconds(-1);
  const previousFrom = new Date(previousTo);
  previousFrom.setDate(previousFrom.getDate() - (days - 1));

  const brandSlug = profile.brand_slug;
  const events = await listEvents({ brandSlug, from, to });
  const previousEvents = access.entitlements.comparison
    ? await listEvents({ brandSlug, from: previousFrom, to: previousTo })
    : [];
  const keys = lastDayKeys(days, to);
  const previousKeys = lastDayKeys(days, previousTo);
  const stats = aggregateEvents(events, keys);
  const previous = aggregateEvents(previousEvents, previousKeys);
  const layout = await getLayout(profile.id);
  const { products } = await getLiveCatalogue();
  const topProducts = stats.topProducts.map((row) => ({
    ...row,
    name: products.find((product) => product.id === row.productId)?.name ?? row.productId,
  }));

  return NextResponse.json({
    plan: access.plan,
    active: access.active,
    readOnly: access.readOnly,
    entitlements: access.entitlements,
    rangeDays: days,
    empty: events.length === 0,
    stats: {
      ...stats,
      topProducts,
      comparison: access.entitlements.comparison ? compareStats(stats, previous) : null,
    },
    layout,
  });
}

export async function PUT(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }
  if (profile.role !== "brand" && profile.role !== "admin") {
    return NextResponse.json({ error: "Brand analytics are for brand accounts." }, { status: 403 });
  }

  const access = profileEntitlements(profile);
  if (access.readOnly) {
    return NextResponse.json({ error: "Your trial has ended. Upgrade to edit the dashboard." }, { status: 402 });
  }
  if (access.entitlements.layout === "fixed") {
    return NextResponse.json({ error: "Starter analytics are not customisable." }, { status: 403 });
  }

  const body = (await request.json()) as { widgets?: string[]; chartType?: string };
  const allowed = new Set(access.entitlements.widgets);
  const widgets = (body.widgets ?? []).filter(
    (id): id is WidgetId => ALL_WIDGETS.includes(id as WidgetId) && allowed.has(id as WidgetId)
  );
  const chartType = access.entitlements.chartTypes.includes(body.chartType as ChartType)
    ? (body.chartType as ChartType)
    : access.entitlements.chartTypes[0];

  const maxWidgets = access.entitlements.layout === "pick" ? 6 : ALL_WIDGETS.length;
  const layout = await setLayout(profile.id, {
    widgets: widgets.slice(0, maxWidgets),
    chartType: chartType ?? "bar",
  });

  return NextResponse.json({ layout });
}
