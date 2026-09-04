"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ALL_WIDGETS,
  WIDGET_META,
  type ChartType,
  type Entitlements,
  type WidgetId,
} from "@/lib/plans";
import type { Delta, FunnelStep, HeatCell } from "@/lib/analytics";
import {
  BasicLineOrBar,
  CrudeBars,
  DeltaBadge,
  DonutLegend,
  FunnelBars,
  HeatmapGrid,
  RadarMix,
  RankBars,
  SeriesChart,
  Sparkline,
  StackedTraffic,
} from "@/components/viz";

type SeriesPoint = {
  date: string;
  iso: string;
  views: number;
  saves: number;
  clicks: number;
  reserves: number;
  follows: number;
  maViews: number;
};

type DashboardPayload = {
  plan: string;
  active: boolean;
  readOnly: boolean;
  entitlements: Entitlements;
  rangeDays: number;
  empty: boolean;
  layout: { widgets: string[]; chartType: string } | null;
  stats: {
    views: number;
    productViews: number;
    saves: number;
    clicks: number;
    followers: number;
    dropInterest: number;
    earlyConversion: number;
    uniqueUsers: number;
    saveRate: number;
    ctr: number;
    reserveRate: number;
    series: SeriesPoint[];
    topProducts: { productId: string; name: string; count: number }[];
    funnel: FunnelStep[];
    heatmap: HeatCell[];
    weekday: { name: string; views: number; saves: number; clicks: number; total: number }[];
    eventMix: { name: string; value: number }[];
    comparison: {
      views: Delta;
      saves: Delta;
      clicks: Delta;
      followers: Delta;
      dropInterest: Delta;
      uniqueUsers: Delta;
      series: (SeriesPoint & { viewsPrev: number; savesPrev: number; clicksPrev: number })[];
    } | null;
  };
};

function valueFor(id: WidgetId, stats: DashboardPayload["stats"]) {
  if (id === "views") return stats.views;
  if (id === "saves") return stats.saves;
  if (id === "clicks") return stats.clicks;
  if (id === "followers") return stats.followers;
  if (id === "drop_interest") return stats.dropInterest;
  if (id === "early_conversion") return `${stats.earlyConversion}%`;
  return null;
}

function deltaFor(id: WidgetId, stats: DashboardPayload["stats"]) {
  const c = stats.comparison;
  if (!c) return null;
  if (id === "views") return c.views.pct;
  if (id === "saves") return c.saves.pct;
  if (id === "clicks") return c.clicks.pct;
  if (id === "followers") return c.followers.pct;
  if (id === "drop_interest") return c.dropInterest.pct;
  return null;
}

function StarterDashboard({ data }: { data: DashboardPayload }) {
  const stats = data.stats;
  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Starter analytics</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[color:var(--muted)]">
          {data.empty
            ? "No events recorded yet. Browse, save and open retailer links to fill this."
            : `Last ${data.rangeDays} days. Starter shows a written summary and a simple bar log — upgrade to Growth for charts.`}
        </p>
      </div>

      <div className="panel border hairline p-6 font-[family-name:var(--font-eyebrow)] text-sm leading-7 tracking-[.02em]">
        <p>
          Product views {stats.views}
          <br />
          Saves {stats.saves}
          <br />
          Outbound clicks {stats.clicks}
        </p>
        <p className="mt-4 text-[color:var(--muted)]">
          {stats.views === 0
            ? "Nobody has opened a piece yet."
            : `${stats.saves} saves and ${stats.clicks} shop clicks from ${stats.views} views.`}
        </p>
      </div>

      <div className="panel border hairline p-6">
        <p className="eyebrow mb-5">Daily views</p>
        <CrudeBars data={stats.series} />
      </div>
    </div>
  );
}

function GrowthDashboard({
  data,
  days,
  chartType,
  widgets,
  onDays,
  onChartType,
  onToggle,
}: {
  data: DashboardPayload;
  days: number;
  chartType: "bar" | "line";
  widgets: WidgetId[];
  onDays: (days: number) => void;
  onChartType: (type: "bar" | "line") => void;
  onToggle: (id: WidgetId) => void;
}) {
  const stats = data.stats;
  const allowed = new Set(data.entitlements.widgets);
  const visibleStats = widgets.filter((id) => WIDGET_META[id].kind === "stat" && allowed.has(id));
  const showTraffic = widgets.includes("traffic_over_time") && allowed.has("traffic_over_time");
  const showTop = widgets.includes("top_products") && allowed.has("top_products");

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="eyebrow">Growth analytics</p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {data.empty
              ? "No events recorded yet. Browse, save and open retailer links to fill this."
              : `${data.rangeDays}-day window · bar or line, up to six widgets`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[7, 30, 90].map((value) => (
            <button
              key={value}
              type="button"
              className={`button !min-h-9 !px-3 text-xs ${days === value ? "button-dark" : "button-quiet"}`}
              onClick={() => onDays(value)}
            >
              {value}d
            </button>
          ))}
          {(["bar", "line"] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={`button !min-h-9 !px-3 text-xs capitalize ${chartType === type ? "button-dark" : "button-quiet"}`}
              onClick={() => onChartType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="panel border hairline p-5">
        <p className="text-xs font-semibold">Choose up to 6 widgets</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.entitlements.widgets.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              className={`button !min-h-9 !px-3 text-xs ${widgets.includes(id) ? "button-dark" : "button-quiet"}`}
            >
              {WIDGET_META[id].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleStats.map((id) => (
          <div key={id} className="panel border hairline p-5">
            <p className="text-xs text-[color:var(--muted)]">{WIDGET_META[id].label}</p>
            <p className="mt-3 text-3xl font-semibold">{valueFor(id, stats)}</p>
            <p className="mt-2 text-[11px] text-[color:var(--muted)]">{WIDGET_META[id].description}</p>
          </div>
        ))}
      </div>

      {showTraffic && (
        <div className="panel border hairline p-5 md:p-7">
          <p className="eyebrow mb-5">Traffic</p>
          <BasicLineOrBar type={chartType} data={stats.series} metric="views" />
        </div>
      )}

      {showTop && (
        <div className="panel border hairline p-5 md:p-7">
          <p className="eyebrow mb-5">Top products</p>
          <RankBars
            rows={stats.topProducts.map((row) => ({ name: row.name, value: row.count }))}
            unit="views"
          />
        </div>
      )}
    </div>
  );
}

function PremiumDashboard({
  data,
  days,
  chartType,
  widgets,
  compare,
  onDays,
  onChartType,
  onToggle,
  onCompare,
}: {
  data: DashboardPayload;
  days: number;
  chartType: ChartType;
  widgets: WidgetId[];
  compare: boolean;
  onDays: (days: number) => void;
  onChartType: (type: ChartType) => void;
  onToggle: (id: WidgetId) => void;
  onCompare: (value: boolean) => void;
}) {
  const stats = data.stats;
  const allowed = new Set(data.entitlements.widgets);
  const visibleStats = widgets.filter((id) => WIDGET_META[id].kind === "stat" && allowed.has(id));
  const show = (id: WidgetId) => widgets.includes(id) && allowed.has(id);
  const series = compare && stats.comparison ? stats.comparison.series : stats.series;
  const spark = useMemo(
    () => ({
      views: stats.series.map((row) => row.views),
      saves: stats.series.map((row) => row.saves),
      clicks: stats.series.map((row) => row.clicks),
    }),
    [stats.series]
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="eyebrow">Premium analytics</p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {data.empty
              ? "No events recorded yet. Browse, save and open retailer links to fill this."
              : `${data.rangeDays}-day window · compared against the previous ${data.rangeDays} days when overlay is on`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[7, 30, 90].map((value) => (
            <button
              key={value}
              type="button"
              className={`button !min-h-9 !px-3 text-xs ${days === value ? "button-dark" : "button-quiet"}`}
              onClick={() => onDays(value)}
            >
              {value}d
            </button>
          ))}
          {data.entitlements.chartTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={`button !min-h-9 !px-3 text-xs capitalize ${chartType === type ? "button-dark" : "button-quiet"}`}
              onClick={() => onChartType(type)}
            >
              {type}
            </button>
          ))}
          <button
            type="button"
            className={`button !min-h-9 !px-3 text-xs ${compare ? "button-dark" : "button-quiet"}`}
            onClick={() => onCompare(!compare)}
          >
            vs prior
          </button>
          <a href="/api/analytics/export" className="button button-quiet !min-h-9 !px-3 text-xs">
            Export CSV
          </a>
        </div>
      </div>

      <div className="panel border hairline p-5">
        <p className="text-xs font-semibold">Dashboard builder</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.entitlements.widgets.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              className={`button !min-h-9 !px-3 text-xs ${widgets.includes(id) ? "button-dark" : "button-quiet"}`}
            >
              {WIDGET_META[id].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleStats.map((id) => {
          const change = deltaFor(id, stats);
          const sparkKey = id === "saves" ? spark.saves : id === "clicks" ? spark.clicks : spark.views;
          return (
            <div key={id} className="panel border hairline p-5">
              <p className="text-xs text-[color:var(--muted)]">{WIDGET_META[id].label}</p>
              <p className="mt-3 text-3xl font-semibold">{valueFor(id, stats)}</p>
              {typeof change === "number" && <DeltaBadge pct={change} />}
              <Sparkline data={sparkKey} />
              <p className="mt-2 text-[11px] text-[color:var(--muted)]">{WIDGET_META[id].description}</p>
            </div>
          );
        })}
      </div>

      {show("traffic_over_time") && (
        <div className="panel border hairline p-5 md:p-7">
          <p className="eyebrow mb-2">Traffic</p>
          <p className="mb-5 text-xs text-[color:var(--muted)]">
            {chartType === "composed"
              ? "Views, saves and clicks on one canvas."
              : "7-day moving average is the smoother line when comparison is off."}
          </p>
          {chartType === "composed" ? (
            <StackedTraffic data={stats.series} />
          ) : (
            <SeriesChart
              type={chartType === "donut" ? "area" : chartType}
              data={series}
              metric="views"
              compareKey={compare ? "viewsPrev" : undefined}
            />
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {show("funnel") && (
          <div className="panel border hairline p-5 md:p-7">
            <p className="eyebrow mb-5">Funnel</p>
            <FunnelBars steps={stats.funnel} />
          </div>
        )}
        {show("conversion") && (
          <div className="panel border hairline p-5 md:p-7">
            <p className="eyebrow mb-5">Rates</p>
            <div className="grid grid-cols-3 gap-4">
              {(
                [
                  ["Save rate", `${stats.saveRate}%`],
                  ["Click-through", `${stats.ctr}%`],
                  ["Reserve rate", `${stats.reserveRate}%`],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-[color:var(--muted)]">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-[color:var(--muted)]">
              {stats.uniqueUsers} known users in this window.
            </p>
          </div>
        )}
      </div>

      {show("heatmap") && (
        <div className="panel border hairline p-5 md:p-7">
          <p className="eyebrow mb-5">Activity heat</p>
          <HeatmapGrid cells={stats.heatmap} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {show("event_mix") && (
          <div className="panel border hairline p-5 md:p-7">
            <p className="eyebrow mb-5">Event mix</p>
            {chartType === "donut" ? <DonutLegend data={stats.eventMix} /> : <RadarMix data={stats.eventMix} />}
          </div>
        )}
        {show("weekday") && (
          <div className="panel border hairline p-5 md:p-7">
            <p className="eyebrow mb-5">Week pattern</p>
            <SeriesChart type="bar" data={stats.weekday.map((row) => ({ date: row.name, views: row.views }))} metric="views" />
          </div>
        )}
      </div>

      {show("top_products") && (
        <div className="panel border hairline p-5 md:p-7">
          <p className="eyebrow mb-5">Top products</p>
          {chartType === "donut" ? (
            <DonutLegend data={stats.topProducts.map((row) => ({ name: row.name, value: row.count }))} />
          ) : (
            <RankBars
              rows={stats.topProducts.map((row) => ({ name: row.name, value: row.count }))}
              unit="views"
            />
          )}
        </div>
      )}
    </div>
  );
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [days, setDays] = useState(30);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [widgets, setWidgets] = useState<WidgetId[]>([]);
  const [compare, setCompare] = useState(false);
  const [error, setError] = useState("");

  async function load(range = days) {
    const response = await fetch(`/api/analytics/dashboard?days=${range}`);
    const payload = (await response.json()) as DashboardPayload & { error?: string };
    if (!response.ok) {
      setError(payload.error || "Could not load analytics.");
      return;
    }
    setData(payload);
    const fallback =
      payload.entitlements.fidelity === "advanced"
        ? payload.entitlements.widgets.filter(
            (id) =>
              WIDGET_META[id].kind === "stat" ||
              id === "traffic_over_time" ||
              id === "funnel" ||
              id === "heatmap" ||
              id === "conversion" ||
              id === "top_products"
          )
        : payload.entitlements.widgets.filter(
            (id) => WIDGET_META[id].kind === "stat" || id === "traffic_over_time"
          );
    const nextWidgets = (payload.layout?.widgets.filter((id) =>
      payload.entitlements.widgets.includes(id as WidgetId)
    ) ?? fallback) as WidgetId[];
    setWidgets(nextWidgets.length ? nextWidgets : fallback);
    const savedType = payload.layout?.chartType;
    setChartType(
      payload.entitlements.chartTypes.includes(savedType as ChartType)
        ? (savedType as ChartType)
        : payload.entitlements.chartTypes[0] ?? "bar"
    );
  }

  useEffect(() => {
    void load(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  async function saveLayout(nextWidgets: WidgetId[], nextChart: ChartType) {
    if (!data || data.entitlements.layout === "fixed" || data.readOnly) return;
    await fetch("/api/analytics/dashboard", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgets: nextWidgets, chartType: nextChart }),
    });
  }

  function toggleWidget(id: WidgetId) {
    if (!data || data.readOnly) return;
    const exists = widgets.includes(id);
    const next = exists ? widgets.filter((item) => item !== id) : [...widgets, id];
    const max = data.entitlements.layout === "pick" ? 6 : ALL_WIDGETS.length;
    const clipped = next.slice(0, max);
    setWidgets(clipped);
    void saveLayout(clipped, chartType);
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-[color:var(--muted)]">Loading analytics…</p>;
  }

  if (data.entitlements.fidelity === "plain") {
    return <StarterDashboard data={data} />;
  }

  if (data.entitlements.fidelity === "basic") {
    return (
      <GrowthDashboard
        data={data}
        days={days}
        chartType={chartType === "line" ? "line" : "bar"}
        widgets={widgets}
        onDays={setDays}
        onChartType={(type) => {
          setChartType(type);
          void saveLayout(widgets, type);
        }}
        onToggle={toggleWidget}
      />
    );
  }

  return (
    <PremiumDashboard
      data={data}
      days={days}
      chartType={chartType}
      widgets={widgets}
      compare={compare}
      onDays={setDays}
      onChartType={(type) => {
        setChartType(type);
        void saveLayout(widgets, type);
      }}
      onToggle={toggleWidget}
      onCompare={setCompare}
    />
  );
}
