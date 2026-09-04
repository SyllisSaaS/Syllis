"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { WEEKDAYS, type FunnelStep, type HeatCell } from "@/lib/analytics";
import type { ChartType } from "@/lib/plans";

export const VIZ = ["#f5a8c8", "#a8d4f5", "#a8f5d4", "#f5e6a8", "#c4b5fd", "#f4f0ea"];

export function ChartTip({
  active,
  payload,
  label,
  money,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string }[];
  label?: string;
  money?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border hairline bg-[color:var(--bg)] px-3 py-2 text-xs">
      {label && <p className="mb-1 text-[color:var(--muted)]">{label}</p>}
      {payload.map((row) => (
        <p key={row.name} className="flex justify-between gap-6">
          <span>{row.name}</span>
          <span>
            {money
              ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(row.value) || 0)
              : row.value}
          </span>
        </p>
      ))}
    </div>
  );
}

export function DeltaBadge({ pct }: { pct: number }) {
  const up = pct > 0;
  const flat = pct === 0;
  return (
    <span
      className={`text-[11px] ${
        flat ? "text-[color:var(--muted)]" : up ? "text-[color:var(--green)]" : "text-[color:var(--pink)]"
      }`}
    >
      {flat ? "0%" : `${up ? "+" : ""}${pct}% vs prior`}
    </span>
  );
}

export function Sparkline({
  data,
  color = "currentColor",
}: {
  data: number[];
  color?: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = Math.max(max - min, 1);
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 28 - ((value - min) / span) * 24;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" className="mt-3 h-8 w-full" preserveAspectRatio="none" aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="1.6" points={points} />
    </svg>
  );
}

export function CrudeBars({
  data,
}: {
  data: { date?: string; name?: string; views?: number; value?: number }[];
}) {
  const rows = data.map((row) => ({
    label: row.date ?? row.name ?? "",
    value: Number(row.views ?? row.value ?? 0),
  }));
  const max = Math.max(...rows.map((row) => row.value), 1);
  const visible = rows.filter((row) => row.value > 0).slice(-14);
  if (visible.length === 0) {
    return <p className="text-sm text-[color:var(--muted)]">No traffic in this window.</p>;
  }
  return (
    <ul className="grid gap-2 font-[family-name:var(--font-eyebrow)] text-[11px] tracking-[.04em]">
      {visible.map((row) => (
        <li key={row.label} className="grid grid-cols-[52px_1fr_28px] items-center gap-3">
          <span className="text-[color:var(--muted)]">{row.label}</span>
          <span className="h-2 bg-[color:var(--line)]">
            <span
              className="block h-2 bg-[color:var(--text)]"
              style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
            />
          </span>
          <span className="text-right">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function FunnelBars({ steps }: { steps: FunnelStep[] }) {
  const top = Math.max(steps[0]?.value ?? 1, 1);
  if (steps.every((step) => step.value === 0)) {
    return <p className="text-sm text-[color:var(--muted)]">No funnel activity yet.</p>;
  }
  return (
    <div className="grid gap-3">
      {steps.map((step, index) => (
        <div key={step.name}>
          <div className="mb-1 flex items-baseline justify-between text-xs">
            <span>{step.name}</span>
            <span className="text-[color:var(--muted)]">
              {step.value}
              {index > 0 ? ` · ${step.rate}%` : ""}
            </span>
          </div>
          <div className="h-8 bg-[color:var(--line)]">
            <div
              className="flex h-8 items-center px-3 text-[11px]"
              style={{
                width: `${Math.max(8, (step.value / top) * 100)}%`,
                background: VIZ[index % VIZ.length],
                color: "#111010",
              }}
            >
              {step.rate}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeatmapGrid({ cells }: { cells: HeatCell[] }) {
  const max = Math.max(...cells.map((cell) => cell.count), 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  if (max <= 0 || cells.every((cell) => cell.count === 0)) {
    return <p className="text-sm text-[color:var(--muted)]">No timed activity yet. Hours are Europe/London.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="mb-1 grid grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-[3px] text-[9px] text-[color:var(--muted)]">
          <span />
          {hours.map((hour) => (
            <span key={hour} className="text-center">
              {hour % 3 === 0 ? hour : ""}
            </span>
          ))}
        </div>
        {WEEKDAYS.map((label, weekday) => (
          <div key={label} className="mb-[3px] grid grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-[3px]">
            <span className="self-center text-[10px] text-[color:var(--muted)]">{label}</span>
            {hours.map((hour) => {
              const cell = cells.find((item) => item.weekday === weekday && item.hour === hour);
              const count = cell?.count ?? 0;
              return (
                <span
                  key={`${weekday}-${hour}`}
                  title={`${label} ${String(hour).padStart(2, "0")}:00 · ${count}`}
                  className="aspect-square"
                  style={{
                    background: "var(--pink)",
                    opacity: count === 0 ? 0.08 : 0.18 + (count / max) * 0.82,
                  }}
                />
              );
            })}
          </div>
        ))}
        <p className="mt-3 text-[11px] text-[color:var(--muted)]">Hours in Europe/London. Darker = more events.</p>
      </div>
    </div>
  );
}

export function RankBars({
  rows,
  unit,
}: {
  rows: { name: string; value: number }[];
  unit?: string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  if (rows.length === 0) return <p className="text-sm text-[color:var(--muted)]">Nothing to rank yet.</p>;
  return (
    <ul className="grid gap-3">
      {rows.map((row, index) => (
        <li key={row.name}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span>{row.name}</span>
            <span className="text-[color:var(--muted)]">
              {row.value}
              {unit ? ` ${unit}` : ""}
            </span>
          </div>
          <div className="h-2 bg-[color:var(--line)]">
            <div
              className="h-2"
              style={{
                width: `${Math.max(3, (row.value / max) * 100)}%`,
                background: VIZ[index % VIZ.length],
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DonutLegend({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-[color:var(--muted)]">No mix to show yet.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_160px] md:items-center">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={VIZ[index % VIZ.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTip />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="grid gap-2 text-xs">
        {data.map((row, index) => (
          <li key={row.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2" style={{ background: VIZ[index % VIZ.length] }} />
              {row.name}
            </span>
            <span>{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RadarMix({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-[color:var(--muted)]">No event mix yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data}>
        <PolarGrid stroke="var(--line)" />
        <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "currentColor" }} />
        <Radar dataKey="value" stroke="var(--pink)" fill="var(--pink)" fillOpacity={0.28} />
        <Tooltip content={<ChartTip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

type SeriesRow = Record<string, string | number>;

function Axes({ money }: { money?: boolean }) {
  return (
    <>
      <CartesianGrid stroke="var(--line)" vertical={false} />
      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
      <YAxis
        allowDecimals={false}
        tick={{ fontSize: 11 }}
        tickFormatter={money ? (value) => `£${value}` : undefined}
      />
      <Tooltip content={<ChartTip money={money} />} />
    </>
  );
}

export function SeriesChart({
  type,
  data,
  metric,
  money,
  compareKey,
  extraKeys,
}: {
  type: ChartType;
  data: SeriesRow[];
  metric: string;
  money?: boolean;
  compareKey?: string;
  extraKeys?: { key: string; color: string; name: string }[];
}) {
  if (data.length === 0 || data.every((row) => Number(row[metric] ?? 0) === 0 && !compareKey)) {
    return <p className="text-sm text-[color:var(--muted)]">No values in this window yet.</p>;
  }

  if (type === "composed" && extraKeys?.length) {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip content={<ChartTip money={money} />} />
          <Legend />
          {extraKeys.map((item, index) =>
            index === 0 ? (
              <Bar key={item.key} yAxisId="left" dataKey={item.key} name={item.name} fill={item.color} />
            ) : index === 1 ? (
              <Line
                key={item.key}
                yAxisId="right"
                type="monotone"
                dataKey={item.key}
                name={item.name}
                stroke={item.color}
                strokeWidth={2}
                dot={false}
              />
            ) : (
              <Area
                key={item.key}
                yAxisId="right"
                type="monotone"
                dataKey={item.key}
                name={item.name}
                stroke={item.color}
                fill={item.color}
                fillOpacity={0.12}
              />
            )
          )}
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <Axes money={money} />
          {compareKey && (
            <Line
              type="monotone"
              dataKey={compareKey}
              name="Prior window"
              stroke="var(--muted)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
          )}
          <Line type="monotone" dataKey={metric} stroke="currentColor" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <Axes money={money} />
          {compareKey && (
            <Area
              type="monotone"
              dataKey={compareKey}
              name="Prior window"
              stroke="var(--muted)"
              fill="var(--muted)"
              fillOpacity={0.08}
            />
          )}
          <Area type="monotone" dataKey={metric} fill="currentColor" fillOpacity={0.12} stroke="currentColor" />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === "donut") {
    return <DonutLegend data={data.map((row) => ({ name: String(row.date ?? row.name), value: Number(row[metric] ?? 0) }))} />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <Axes money={money} />
        {compareKey && <Bar dataKey={compareKey} name="Prior window" fill="var(--line)" />}
        <Bar dataKey={metric} fill="currentColor" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StackedTraffic({
  data,
}: {
  data: { date: string; views: number; saves: number; clicks: number }[];
}) {
  if (data.every((row) => row.views + row.saves + row.clicks === 0)) {
    return <p className="text-sm text-[color:var(--muted)]">No stacked traffic yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip content={<ChartTip />} />
        <Legend />
        <Area type="monotone" dataKey="views" stackId="1" stroke={VIZ[1]} fill={VIZ[1]} fillOpacity={0.55} />
        <Area type="monotone" dataKey="saves" stackId="1" stroke={VIZ[0]} fill={VIZ[0]} fillOpacity={0.7} />
        <Area type="monotone" dataKey="clicks" stackId="1" stroke={VIZ[2]} fill={VIZ[2]} fillOpacity={0.7} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BasicLineOrBar({
  type,
  data,
  metric,
}: {
  type: "bar" | "line";
  data: SeriesRow[];
  metric: string;
}) {
  if (data.every((row) => Number(row[metric] ?? 0) === 0)) {
    return <p className="text-sm text-[color:var(--muted)]">No traffic in this range yet.</p>;
  }
  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} hide />
          <Tooltip content={<ChartTip />} />
          <Line type="monotone" dataKey={metric} stroke="currentColor" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} hide />
        <Tooltip content={<ChartTip />} />
        <Bar dataKey={metric} fill="currentColor" />
      </BarChart>
    </ResponsiveContainer>
  );
}
