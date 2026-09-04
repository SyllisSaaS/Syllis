export const ANALYTICS_EVENTS = [
  "page_view",
  "product_view",
  "product_save",
  "outbound_click",
  "drop_view",
  "drop_reserve",
  "brand_follow",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsEvent = {
  id: string;
  name: AnalyticsEventName;
  path: string | null;
  product_id: string | null;
  brand_slug: string | null;
  user_id: string | null;
  created_at: string;
};

export type DayPoint = {
  date: string;
  iso: string;
  views: number;
  saves: number;
  clicks: number;
  reserves: number;
  follows: number;
};

export type FunnelStep = { name: string; value: number; rate: number };

export type HeatCell = { weekday: number; hour: number; count: number };

export type NamedCount = { name: string; value: number };

export type Delta = { current: number; previous: number; change: number; pct: number };

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const EVENT_LABELS: Record<AnalyticsEventName, string> = {
  page_view: "Page views",
  product_view: "Product views",
  product_save: "Saves",
  outbound_click: "Retailer clicks",
  drop_view: "Drop views",
  drop_reserve: "Reserves",
  brand_follow: "Follows",
};

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === "string" && ANALYTICS_EVENTS.includes(value as AnalyticsEventName);
}

export function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export function lastDayKeys(n: number, end = new Date()) {
  const keys: string[] = [];
  const cursor = new Date(end);
  cursor.setHours(12, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

export function shortDate(iso: string) {
  return iso.slice(5);
}

export function pct(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export function delta(current: number, previous: number): Delta {
  const change = current - previous;
  if (previous === 0) {
    return { current, previous, change, pct: current === 0 ? 0 : 100 };
  }
  return {
    current,
    previous,
    change,
    pct: Math.round((change / previous) * 1000) / 10,
  };
}

function londonParts(iso: string) {
  const date = new Date(iso);
  const weekday = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
  }).format(date);
  const hourRaw = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(date);
  const hour = Number.parseInt(hourRaw, 10);
  const map: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return { weekday: map[weekday] ?? 0, hour: Number.isFinite(hour) ? hour : 0 };
}

function emptyDay(iso: string): DayPoint {
  return { date: shortDate(iso), iso, views: 0, saves: 0, clicks: 0, reserves: 0, follows: 0 };
}

export function fillDaySeries(days: string[], rows: Map<string, DayPoint>): DayPoint[] {
  return days.map((iso) => rows.get(iso) ?? emptyDay(iso));
}

export function movingAverage(series: DayPoint[], key: keyof DayPoint, window = 7) {
  return series.map((row, index) => {
    const slice = series.slice(Math.max(0, index - window + 1), index + 1);
    const avg = slice.reduce((sum, item) => sum + Number(item[key] ?? 0), 0) / slice.length;
    return Math.round(avg * 10) / 10;
  });
}

export function aggregateEvents(events: AnalyticsEvent[], days?: string[]) {
  const views = events.filter((e) => e.name === "product_view" || e.name === "page_view").length;
  const productViews = events.filter((e) => e.name === "product_view").length;
  const saves = events.filter((e) => e.name === "product_save").length;
  const clicks = events.filter((e) => e.name === "outbound_click").length;
  const dropViews = events.filter((e) => e.name === "drop_view").length;
  const reserves = events.filter((e) => e.name === "drop_reserve").length;
  const followers = events.filter((e) => e.name === "brand_follow").length;
  const pageViews = events.filter((e) => e.name === "page_view").length;

  const byDay = new Map<string, DayPoint>();
  const mix = new Map<string, number>();
  const byProduct = new Map<string, number>();
  const byBrand = new Map<string, { views: number; saves: number; clicks: number }>();
  const heat = new Map<string, number>();
  const weekday = Array.from({ length: 7 }, () => ({ views: 0, saves: 0, clicks: 0, total: 0 }));
  const hour = Array.from({ length: 24 }, () => 0);
  const uniqueUsers = new Set<string>();

  for (const event of events) {
    mix.set(event.name, (mix.get(event.name) ?? 0) + 1);
    if (event.user_id) uniqueUsers.add(event.user_id);

    const iso = dayKey(event.created_at);
    const row = byDay.get(iso) ?? emptyDay(iso);
    if (event.name === "product_view" || event.name === "page_view" || event.name === "drop_view") {
      row.views += 1;
    }
    if (event.name === "product_save") row.saves += 1;
    if (event.name === "outbound_click") row.clicks += 1;
    if (event.name === "drop_reserve") row.reserves += 1;
    if (event.name === "brand_follow") row.follows += 1;
    byDay.set(iso, row);

    if (event.product_id && (event.name === "product_view" || event.name === "drop_view")) {
      byProduct.set(event.product_id, (byProduct.get(event.product_id) ?? 0) + 1);
    }

    if (event.brand_slug) {
      const brand = byBrand.get(event.brand_slug) ?? { views: 0, saves: 0, clicks: 0 };
      if (event.name === "product_view" || event.name === "page_view" || event.name === "drop_view") {
        brand.views += 1;
      }
      if (event.name === "product_save") brand.saves += 1;
      if (event.name === "outbound_click") brand.clicks += 1;
      byBrand.set(event.brand_slug, brand);
    }

    const parts = londonParts(event.created_at);
    heat.set(`${parts.weekday}-${parts.hour}`, (heat.get(`${parts.weekday}-${parts.hour}`) ?? 0) + 1);
    weekday[parts.weekday].total += 1;
    if (event.name === "product_view" || event.name === "page_view" || event.name === "drop_view") {
      weekday[parts.weekday].views += 1;
    }
    if (event.name === "product_save") weekday[parts.weekday].saves += 1;
    if (event.name === "outbound_click") weekday[parts.weekday].clicks += 1;
    hour[parts.hour] += 1;
  }

  const heatmap: HeatCell[] = [];
  for (let w = 0; w < 7; w += 1) {
    for (let h = 0; h < 24; h += 1) {
      heatmap.push({ weekday: w, hour: h, count: heat.get(`${w}-${h}`) ?? 0 });
    }
  }

  const funnelViews = productViews + pageViews + dropViews;
  const funnel: FunnelStep[] = [
    { name: "Views", value: funnelViews, rate: 100 },
    { name: "Saves", value: saves, rate: pct(saves, funnelViews) },
    { name: "Clicks", value: clicks, rate: pct(clicks, funnelViews) },
    { name: "Reserves", value: reserves, rate: pct(reserves, funnelViews) },
  ];

  const series = fillDaySeries(days ?? [...byDay.keys()].sort(), byDay);
  const maViews = movingAverage(series, "views");

  return {
    views,
    productViews,
    pageViews,
    saves,
    clicks,
    dropViews,
    reserves,
    followers,
    dropInterest: dropViews + reserves,
    earlyConversion: dropViews === 0 ? 0 : Math.round((reserves / dropViews) * 100),
    uniqueUsers: uniqueUsers.size,
    saveRate: pct(saves, Math.max(productViews, 1)),
    ctr: pct(clicks, Math.max(productViews, 1)),
    reserveRate: pct(reserves, Math.max(dropViews, 1)),
    followRate: pct(followers, Math.max(views, 1)),
    series: series.map((row, index) => ({ ...row, maViews: maViews[index] })),
    topProducts: [...byProduct.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([productId, count]) => ({ productId, count })),
    topBrands: [...byBrand.entries()]
      .sort((a, b) => b[1].views - a[1].views)
      .slice(0, 8)
      .map(([slug, counts]) => ({ slug, ...counts })),
    eventMix: [...mix.entries()]
      .map(([name, value]) => ({
        name: EVENT_LABELS[name as AnalyticsEventName] ?? name,
        value,
      }))
      .sort((a, b) => b.value - a.value),
    funnel,
    heatmap,
    weekday: weekday.map((row, index) => ({
      name: WEEKDAYS[index],
      ...row,
    })),
    hours: hour.map((value, hourOfDay) => ({
      name: `${String(hourOfDay).padStart(2, "0")}`,
      value,
    })),
  };
}

export function compareStats(
  current: ReturnType<typeof aggregateEvents>,
  previous: ReturnType<typeof aggregateEvents>
) {
  return {
    views: delta(current.views, previous.views),
    saves: delta(current.saves, previous.saves),
    clicks: delta(current.clicks, previous.clicks),
    followers: delta(current.followers, previous.followers),
    dropInterest: delta(current.dropInterest, previous.dropInterest),
    uniqueUsers: delta(current.uniqueUsers, previous.uniqueUsers),
    series: current.series.map((row, index) => ({
      ...row,
      viewsPrev: previous.series[index]?.views ?? 0,
      savesPrev: previous.series[index]?.saves ?? 0,
      clicksPrev: previous.series[index]?.clicks ?? 0,
    })),
  };
}
