"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Delta, FunnelStep, HeatCell } from "@/lib/analytics";
import {
  ChartTip,
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
  VIZ,
} from "@/components/viz";

type Person = {
  id: string;
  role: string;
  email: string | null;
  full_name: string | null;
  brand_slug: string | null;
  verification_status: string | null;
  brand_status: string | null;
  plan: string | null;
  founding_brand: boolean;
  created_at: string;
};

export type AdminOverview = {
  configured: boolean;
  rangeDays: number;
  income: { totalPence: number; monthPence: number; currency: string };
  counts: { shoppers: number; brands: number; stylists: number; pending: number; openReports: number };
  people: Person[];
  ledger: { id: string; source: string; amount_pence: number; description: string | null; occurred_at: string }[];
  series: {
    date: string;
    iso: string;
    income: number;
    signups: number;
    views: number;
    saves: number;
    clicks: number;
    reserves: number;
    maViews: number;
    viewsPrev: number;
    incomePrev: number;
    signupsPrev: number;
  }[];
  byRole: { name: string; value: number }[];
  bySource: { name: string; value: number }[];
  byPlan: { name: string; value: number }[];
  verification: { name: string; value: number }[];
  brandStatus: { name: string; value: number }[];
  events: { views: number; saves: number; clicks: number; uniqueUsers: number };
  funnel: FunnelStep[];
  heatmap: HeatCell[];
  weekday: { name: string; views: number; saves: number; clicks: number; total: number }[];
  hours: { name: string; value: number }[];
  eventMix: { name: string; value: number }[];
  topBrands: { slug: string; name: string; views: number; saves: number; clicks: number }[];
  rates: { saveRate: number; ctr: number; viewsPerSignup: number; conversion: number };
  deltas: {
    views: Delta;
    saves: Delta;
    clicks: Delta;
    income: Delta;
    signups: Delta;
  } | null;
};

type ChartType = "bar" | "line" | "area";
type WidgetId =
  | "kpi"
  | "traffic"
  | "mix"
  | "sources"
  | "ledger"
  | "funnel"
  | "heatmap"
  | "composed"
  | "rates"
  | "plans"
  | "pipeline"
  | "brands"
  | "radar";

const WIDGETS: { id: WidgetId; label: string }[] = [
  { id: "kpi", label: "Counts" },
  { id: "traffic", label: "Activity" },
  { id: "composed", label: "Overlay" },
  { id: "funnel", label: "Funnel" },
  { id: "heatmap", label: "Heatmap" },
  { id: "rates", label: "Rates" },
  { id: "radar", label: "Event mix" },
  { id: "plans", label: "Plans" },
  { id: "pipeline", label: "Pipeline" },
  { id: "brands", label: "Brands" },
  { id: "mix", label: "Accounts" },
  { id: "sources", label: "Income sources" },
  { id: "ledger", label: "Ledger" },
];

export const DEFAULT_ADMIN_WIDGETS: WidgetId[] = [
  "kpi",
  "traffic",
  "composed",
  "funnel",
  "heatmap",
  "rates",
  "mix",
  "sources",
  "ledger",
];

function money(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

function pounds(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
}

function ModeButtons<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`button !min-h-9 !px-3 text-xs capitalize ${value === option.id ? "button-dark" : "button-quiet"}`}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function AdminAnalytics({
  overview,
  chartType,
  metric,
  widgets,
  days,
  onChartType,
  onMetric,
  onWidgets,
  onDays,
}: {
  overview: AdminOverview;
  chartType: ChartType;
  metric: "income" | "signups" | "views";
  widgets: WidgetId[];
  days: number;
  onChartType: (type: ChartType) => void;
  onMetric: (metric: "income" | "signups" | "views") => void;
  onWidgets: (widgets: WidgetId[]) => void;
  onDays: (days: number) => void;
}) {
  const [funnelView, setFunnelView] = useState<"funnel" | "table">("funnel");
  const [heatView, setHeatView] = useState<"heat" | "weekday" | "hours">("heat");
  const [composedView, setComposedView] = useState<"overlay" | "stack" | "table">("overlay");
  const [brandView, setBrandView] = useState<"bars" | "table">("bars");
  const [mixView, setMixView] = useState<"radar" | "donut">("radar");
  const [planView, setPlanView] = useState<"donut" | "bars">("donut");

  const roleDonut = overview.byRole.filter((row) => row.name !== "Admin");
  const spark = useMemo(
    () => ({
      income: overview.series.map((row) => row.income),
      signups: overview.series.map((row) => row.signups),
      views: overview.series.map((row) => row.views),
      saves: overview.series.map((row) => row.saves),
      clicks: overview.series.map((row) => row.clicks),
    }),
    [overview.series]
  );

  function toggle(id: WidgetId) {
    const next = widgets.includes(id) ? widgets.filter((item) => item !== id) : [...widgets, id];
    onWidgets(next);
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel border hairline p-7">
          <p className="eyebrow">This month</p>
          <p className="mt-4 text-[clamp(40px,6vw,72px)] font-semibold tracking-[-.07em]">
            {money(overview.income.monthPence)}
          </p>
        </div>
        <div className="panel border hairline p-7">
          <p className="eyebrow">All-time income</p>
          <p className="mt-4 text-[clamp(40px,6vw,72px)] font-semibold tracking-[-.07em]">
            {money(overview.income.totalPence)}
          </p>
        </div>
      </div>

      <div className="panel border hairline p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold">Modules</p>
            <p className="mt-1 text-xs text-[color:var(--muted)]">
              Show or hide panels. Chart style lives on the activity chart only. Range applies to
              event analytics, not month / all-time income.
            </p>
          </div>
          <ModeButtons
            value={String(days)}
            options={[
              { id: "7", label: "7d" },
              { id: "30", label: "30d" },
              { id: "90", label: "90d" },
            ]}
            onChange={(id) => onDays(Number(id))}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {WIDGETS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`button !min-h-9 !px-3 text-xs ${widgets.includes(item.id) ? "button-dark" : "button-quiet"}`}
              onClick={() => toggle(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {widgets.includes("kpi") && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {(
              [
                ["Shoppers", overview.counts.shoppers],
                ["Brands", overview.counts.brands],
                ["Stylists", overview.counts.stylists],
                ["Pending apps", overview.counts.pending],
                ["Open reports", overview.counts.openReports],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="panel border hairline p-5">
                <p className="text-xs text-[color:var(--muted)]">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {(
              [
                ["Product views", overview.events.views, overview.deltas?.views.pct, spark.views],
                ["Saves", overview.events.saves, overview.deltas?.saves.pct, spark.saves],
                ["Retailer clicks", overview.events.clicks, overview.deltas?.clicks.pct, spark.clicks],
                ["Known users", overview.events.uniqueUsers, undefined, spark.signups],
              ] as const
            ).map(([label, value, change, sparkline]) => (
              <div key={label} className="panel border hairline p-5">
                <p className="text-xs text-[color:var(--muted)]">
                  {label} ({overview.rangeDays}d)
                </p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
                {typeof change === "number" && <DeltaBadge pct={change} />}
                <Sparkline data={[...sparkline]} />
              </div>
            ))}
          </div>
        </>
      )}

      {widgets.includes("traffic") && (
        <div className="panel border hairline p-5 md:p-7">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Activity · last {overview.rangeDays} days</p>
              <p className="mt-2 text-xs text-[color:var(--muted)]">
                {metric === "income" && "Pounds recorded in the ledger (Stripe and stylist cuts)."}
                {metric === "signups" && "New Syllis accounts created that day."}
                {metric === "views" && "Product page views from stored events."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["income", "signups", "views"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`button !min-h-9 !px-3 text-xs capitalize ${metric === id ? "button-dark" : "button-quiet"}`}
                  onClick={() => onMetric(id)}
                >
                  {id}
                </button>
              ))}
              {(["bar", "line", "area"] as const).map((type) => (
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
          {overview.series.every((row) => row[metric] === 0) ? (
            <p className="text-sm text-[color:var(--muted)]">No {metric} in this window yet.</p>
          ) : (
            <SeriesChart
              type={chartType}
              metric={metric}
              money={metric === "income"}
              data={overview.series}
              compareKey={metric === "views" ? "viewsPrev" : metric === "income" ? "incomePrev" : "signupsPrev"}
            />
          )}
        </div>
      )}

      {widgets.includes("composed") && (
        <div className="panel border hairline p-5 md:p-7">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Overlay · income, signups, views</p>
              <p className="mt-2 text-xs text-[color:var(--muted)]">
                Independent of the activity chart. Dual axis: pounds on the left, counts on the right.
              </p>
            </div>
            <ModeButtons
              value={composedView}
              options={[
                { id: "overlay", label: "overlay" },
                { id: "stack", label: "stacked" },
                { id: "table", label: "table" },
              ]}
              onChange={setComposedView}
            />
          </div>
          {composedView === "overlay" && (
            <SeriesChart
              type="composed"
              metric="income"
              money
              data={overview.series}
              extraKeys={[
                { key: "income", color: VIZ[0], name: "Income" },
                { key: "signups", color: VIZ[1], name: "Signups" },
                { key: "views", color: VIZ[2], name: "Views" },
              ]}
            />
          )}
          {composedView === "stack" && <StackedTraffic data={overview.series} />}
          {composedView === "table" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[.12em] text-[color:var(--muted)]">
                  <tr>
                    <th className="pb-3">Day</th>
                    <th className="pb-3">Income</th>
                    <th className="pb-3">Signups</th>
                    <th className="pb-3">Views</th>
                    <th className="pb-3">Saves</th>
                    <th className="pb-3">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.series.map((row) => (
                    <tr key={row.iso} className="border-t hairline">
                      <td className="py-2">{row.date}</td>
                      <td>{pounds(row.income)}</td>
                      <td>{row.signups}</td>
                      <td>{row.views}</td>
                      <td>{row.saves}</td>
                      <td>{row.clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {widgets.includes("funnel") && (
          <div className="panel border hairline p-5 md:p-7">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Discovery funnel</p>
                <p className="mt-2 text-xs text-[color:var(--muted)]">Views → saves → retailer clicks → reserves.</p>
              </div>
              <ModeButtons
                value={funnelView}
                options={[
                  { id: "funnel", label: "bars" },
                  { id: "table", label: "table" },
                ]}
                onChange={setFunnelView}
              />
            </div>
            {funnelView === "funnel" ? (
              <FunnelBars steps={overview.funnel} />
            ) : (
              <ul className="divide-y hairline text-sm">
                {overview.funnel.map((step) => (
                  <li key={step.name} className="flex justify-between py-3">
                    <span>{step.name}</span>
                    <span>
                      {step.value} · {step.rate}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {widgets.includes("rates") && (
          <div className="panel border hairline p-5 md:p-7">
            <p className="eyebrow mb-5">Conversion rates</p>
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  ["Save rate", `${overview.rates.saveRate}%`, "Saves / product views"],
                  ["Click-through", `${overview.rates.ctr}%`, "Retailer clicks / product views"],
                  ["Click share of views", `${overview.rates.conversion}%`, "Any click vs all views"],
                  ["Views per signup", overview.rates.viewsPerSignup, "Traffic efficiency"],
                ] as const
              ).map(([label, value, note]) => (
                <div key={label}>
                  <p className="text-xs text-[color:var(--muted)]">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                  <p className="mt-1 text-[11px] text-[color:var(--muted)]">{note}</p>
                </div>
              ))}
            </div>
            {overview.deltas && (
              <div className="mt-6 flex flex-wrap gap-4 text-xs text-[color:var(--muted)]">
                <span>
                  Window income {pounds(overview.deltas.income.current)}{" "}
                  <DeltaBadge pct={overview.deltas.income.pct} />
                </span>
                <span>
                  Signups {overview.deltas.signups.current}{" "}
                  <DeltaBadge pct={overview.deltas.signups.pct} />
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {widgets.includes("heatmap") && (
        <div className="panel border hairline p-5 md:p-7">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">When the site is alive</p>
              <p className="mt-2 text-xs text-[color:var(--muted)]">
                Event density by weekday and hour. Switch to weekday or hourly bars.
              </p>
            </div>
            <ModeButtons
              value={heatView}
              options={[
                { id: "heat", label: "heatmap" },
                { id: "weekday", label: "weekday" },
                { id: "hours", label: "hourly" },
              ]}
              onChange={setHeatView}
            />
          </div>
          {heatView === "heat" && <HeatmapGrid cells={overview.heatmap} />}
          {heatView === "weekday" && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={overview.weekday}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="views" name="Views" fill={VIZ[1]} />
                <Bar dataKey="saves" name="Saves" fill={VIZ[0]} />
                <Bar dataKey="clicks" name="Clicks" fill={VIZ[2]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {heatView === "hours" && <CrudeBars data={overview.hours} />}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {widgets.includes("radar") && (
          <div className="panel border hairline p-5 md:p-7">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Event mix</p>
                <p className="mt-2 text-xs text-[color:var(--muted)]">Composition of stored events, not income.</p>
              </div>
              <ModeButtons
                value={mixView}
                options={[
                  { id: "radar", label: "radar" },
                  { id: "donut", label: "donut" },
                ]}
                onChange={setMixView}
              />
            </div>
            {mixView === "radar" ? <RadarMix data={overview.eventMix} /> : <DonutLegend data={overview.eventMix} />}
          </div>
        )}

        {widgets.includes("brands") && (
          <div className="panel border hairline p-5 md:p-7">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Brand activity</p>
                <p className="mt-2 text-xs text-[color:var(--muted)]">Views on catalogue brands from stored events.</p>
              </div>
              <ModeButtons
                value={brandView}
                options={[
                  { id: "bars", label: "bars" },
                  { id: "table", label: "table" },
                ]}
                onChange={setBrandView}
              />
            </div>
            {brandView === "bars" ? (
              <RankBars
                rows={overview.topBrands.map((row) => ({ name: row.name, value: row.views }))}
                unit="views"
              />
            ) : overview.topBrands.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">No branded events yet.</p>
            ) : (
              <ul className="divide-y hairline text-sm">
                {overview.topBrands.map((row) => (
                  <li key={row.slug} className="flex justify-between gap-4 py-3">
                    <span>{row.name}</span>
                    <span className="text-[color:var(--muted)]">
                      {row.views} views · {row.saves} saves · {row.clicks} clicks
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {widgets.includes("plans") && (
          <div className="panel border hairline p-5 md:p-7">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Accounts by plan</p>
                <p className="mt-2 text-xs text-[color:var(--muted)]">Live plan mix. Admin accounts are excluded.</p>
              </div>
              <ModeButtons
                value={planView}
                options={[
                  { id: "donut", label: "donut" },
                  { id: "bars", label: "bars" },
                ]}
                onChange={setPlanView}
              />
            </div>
            {planView === "donut" ? (
              <DonutLegend data={overview.byPlan} />
            ) : (
              <RankBars rows={overview.byPlan} />
            )}
          </div>
        )}

        {widgets.includes("pipeline") && (
          <div className="panel border hairline p-5 md:p-7">
            <p className="eyebrow mb-2">Verification pipeline</p>
            <p className="mb-5 text-xs text-[color:var(--muted)]">Brand and stylist accounts by verification status.</p>
            <FunnelBars
              steps={overview.verification.map((row, index, all) => ({
                name: row.name,
                value: row.value,
                rate: all[0] ? Math.round((row.value / Math.max(all.reduce((s, r) => s + r.value, 0), 1)) * 1000) / 10 : 0,
              }))}
            />
            {overview.brandStatus.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-xs text-[color:var(--muted)]">Brand listing status</p>
                <RankBars rows={overview.brandStatus} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {widgets.includes("mix") && (
          <div className="panel border hairline p-5 md:p-7">
            <p className="eyebrow mb-2">Accounts by role</p>
            <p className="mb-5 text-xs text-[color:var(--muted)]">
              Live account counts. This is not income and does not follow the activity chart.
            </p>
            <DonutLegend data={roleDonut} />
          </div>
        )}

        {widgets.includes("sources") && (
          <div className="panel border hairline p-5 md:p-7">
            <p className="eyebrow mb-2">Income sources</p>
            <p className="mb-5 text-xs text-[color:var(--muted)]">
              Share of ledger totals (subscriptions, stylist cut, ads).
            </p>
            {overview.bySource.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">
                Empty until a payout or Stripe invoice lands in the ledger.
              </p>
            ) : (
              <DonutLegend data={overview.bySource} />
            )}
          </div>
        )}
      </div>

      {widgets.includes("ledger") && (
        <div className="panel border hairline p-6">
          <p className="eyebrow mb-4">Ledger</p>
          {overview.ledger.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">
              No income recorded yet. Stripe invoice.paid events and stylist cuts land here.
            </p>
          ) : (
            <ul className="divide-y hairline text-sm">
              {overview.ledger.map((row) => (
                <li key={row.id} className="flex justify-between gap-4 py-3">
                  <span>
                    {row.source} · {row.description}
                  </span>
                  <span>{money(row.amount_pence)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
