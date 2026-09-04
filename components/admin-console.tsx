"use client";

import { useEffect, useMemo, useState } from "react";
import { STYLIST_PLATFORM_CUT } from "@/lib/founding";
import { AdminAnalytics, DEFAULT_ADMIN_WIDGETS, type AdminOverview } from "@/components/admin-analytics";
import { AdminAnalyticsReset } from "@/components/admin-analytics-reset";
import { AdminCatalogue } from "@/components/admin-catalogue";
import { AdminPayments } from "@/components/admin-payments";

type Person = AdminOverview["people"][number];

type Application = {
  id: string;
  user_id: string;
  kind: string;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
};

type Report = {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
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

const LAYOUT_KEY = "syllis-admin-layout";

function money(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

export function AdminConsole() {
  const [tab, setTab] = useState<
    "overview" | "payments" | "catalogue" | "people" | "applications" | "reports" | "stylists" | "lab"
  >("overview");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [message, setMessage] = useState("");
  const [gross, setGross] = useState("100");
  const [stylistId, setStylistId] = useState("");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [widgets, setWidgets] = useState<WidgetId[]>(DEFAULT_ADMIN_WIDGETS);
  const [metric, setMetric] = useState<"income" | "signups" | "views">("income");
  const [days, setDays] = useState(30);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [testBrand, setTestBrand] = useState<{ email: string; password: string; userId?: string } | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAYOUT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        chartType?: ChartType;
        widgets?: WidgetId[];
        metric?: typeof metric;
        days?: number;
      };
      if (saved.chartType === "bar" || saved.chartType === "line" || saved.chartType === "area") {
        setChartType(saved.chartType);
      }
      if (saved.widgets?.length) {
        const legacy = ["kpi", "traffic", "mix", "sources", "ledger"];
        const isLegacy =
          saved.widgets.length <= 5 && saved.widgets.every((id) => legacy.includes(id));
        setWidgets(
          isLegacy
            ? [...saved.widgets, "composed", "funnel", "heatmap", "rates"]
            : saved.widgets
        );
      }
      if (saved.metric) setMetric(saved.metric);
      if (saved.days === 7 || saved.days === 30 || saved.days === 90) setDays(saved.days);
    } catch {
      // Ignore blocked storage.
    }
  }, []);

  function persist(next: { chartType: ChartType; widgets: WidgetId[]; metric: typeof metric; days: number }) {
    try {
      window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(next));
    } catch {
      // Ignore blocked storage.
    }
  }

  async function load(range = days) {
    const [overRes, appsRes, repsRes] = await Promise.all([
      fetch(`/api/admin/overview?days=${range}`),
      fetch("/api/applications"),
      fetch("/api/reports"),
    ]);
    const over = (await overRes.json()) as AdminOverview & { error?: string };
    const apps = (await appsRes.json()) as { items?: Application[]; error?: string };
    const reps = (await repsRes.json()) as { items?: Report[]; error?: string };
    if (over.error) setMessage(over.error);
    setOverview(over.error ? null : over);
    setApplications(apps.items ?? []);
    setReports(reps.items ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function patchPerson(userId: string, body: Record<string, unknown>) {
    const response = await fetch("/api/admin/overview", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...body }),
    });
    const payload = (await response.json()) as { error?: string };
    setMessage(payload.error || "Updated.");
    await load();
  }

  async function removePerson(userId: string, label: string) {
    if (!window.confirm(`Remove ${label}? They will not be able to log in.`)) return;
    const response = await fetch("/api/admin/overview", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const payload = (await response.json()) as { error?: string; removed?: string };
    setMessage(payload.error || `Removed ${payload.removed || label}.`);
    if (testBrand && (testBrand.userId === userId || testBrand.email === label)) {
      setTestBrand(null);
    }
    await load();
  }

  async function reviewApp(id: string, status: "approved" | "rejected", founding_brand?: boolean) {
    const response = await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, founding_brand }),
    });
    const payload = (await response.json()) as { error?: string };
    setMessage(payload.error || `Application ${status}.`);
    await load();
  }

  async function reviewReport(id: string, status: string) {
    await fetch("/api/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  async function payout() {
    const response = await fetch("/api/admin/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stylistId,
        grossPence: Math.round(Number(gross) * 100),
        note: "Manual stylist payout",
      }),
    });
    const payload = (await response.json()) as { error?: string; cut?: number; net?: number };
    setMessage(payload.error || `Cut ${money(payload.cut ?? 0)} kept, ${money(payload.net ?? 0)} to stylist.`);
    await load();
  }

  async function createTestBrand() {
    setCreating(true);
    const response = await fetch("/api/admin/test-brand", { method: "POST" });
    const payload = (await response.json()) as {
      error?: string;
      email?: string;
      password?: string;
      userId?: string;
    };
    setCreating(false);
    if (!response.ok || !payload.email || !payload.password) {
      setMessage(payload.error || "Could not create test brand.");
      return;
    }
    setTestBrand({ email: payload.email, password: payload.password, userId: payload.userId });
    setMessage("Test brand ready. Use a private window to log in.");
    await load();
  }

  const tabs = ["overview", "payments", "catalogue", "people", "applications", "reports", "stylists", "lab"] as const;
  const stylists = overview?.people.filter((p) => p.role === "stylist") ?? [];
  const people = useMemo(() => {
    const rows = overview?.people ?? [];
    return rows.filter((person) => {
      const roleOk = roleFilter === "all" || person.role === roleFilter;
      const hay = `${person.email ?? ""} ${person.full_name ?? ""} ${person.brand_slug ?? ""}`.toLowerCase();
      return roleOk && hay.includes(query.toLowerCase());
    });
  }, [overview?.people, query, roleFilter]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((id) => (
          <button
            key={id}
            type="button"
            className={`button !min-h-9 !px-3 text-xs capitalize ${tab === id ? "button-dark" : "button-quiet"}`}
            onClick={() => setTab(id)}
          >
            {id === "lab" ? "Test lab" : id}
          </button>
        ))}
      </div>

      {message && <p className="text-sm">{message}</p>}

      {tab === "overview" && !overview && (
        <p className="text-sm text-[color:var(--muted)]">Loading income and counts…</p>
      )}

      {tab === "overview" && overview && (
        <>
          <AdminAnalyticsReset days={days} onChanged={() => void load(days)} />
          <AdminAnalytics
          overview={overview}
          chartType={chartType}
          metric={metric}
          widgets={widgets}
          days={days}
          onChartType={(type) => {
            setChartType(type);
            persist({ chartType: type, widgets, metric, days });
          }}
          onMetric={(id) => {
            setMetric(id);
            persist({ chartType, widgets, metric: id, days });
          }}
          onWidgets={(next) => {
            setWidgets(next);
            persist({ chartType, widgets: next, metric, days });
          }}
          onDays={(next) => {
            setDays(next);
            persist({ chartType, widgets, metric, days: next });
            void load(next);
          }}
        />
        </>
      )}

      {tab === "payments" && <AdminPayments />}

      {tab === "catalogue" && <AdminCatalogue />}

      {tab === "people" && (
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email"
              className="border hairline bg-transparent px-3 py-2 text-sm"
            />
            {["all", "shopper", "brand", "stylist", "admin"].map((id) => (
              <button
                key={id}
                type="button"
                className={`button !min-h-9 !px-3 text-xs capitalize ${roleFilter === id ? "button-dark" : "button-quiet"}`}
                onClick={() => setRoleFilter(id)}
              >
                {id}
              </button>
            ))}
          </div>
          <div className="panel overflow-x-auto border hairline">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[.12em] text-[color:var(--muted)]">
                <tr>
                  <th className="p-4">Person</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {people.map((person) => (
                  <tr key={person.id} className="border-t hairline">
                    <td className="p-4">
                      <p className="font-semibold">{person.full_name || person.email}</p>
                      <p className="text-xs text-[color:var(--muted)]">
                        {person.email} {person.brand_slug ? `· ${person.brand_slug}` : ""}
                      </p>
                    </td>
                    <td className="p-4">{person.role}</td>
                    <td className="p-4">
                      {person.verification_status}
                      {person.plan ? ` · ${person.plan}` : ""}
                      {person.founding_brand ? " · founding" : ""}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {(person.role === "brand" || person.role === "stylist") && (
                          <>
                            <button
                              type="button"
                              className="button button-quiet !min-h-8 !px-3 text-xs"
                              onClick={() =>
                                patchPerson(person.id, {
                                  brand_status: "active",
                                  verification_status: "verified",
                                })
                              }
                            >
                              Verify
                            </button>
                            <button
                              type="button"
                              className="button button-quiet !min-h-8 !px-3 text-xs"
                              onClick={() => patchPerson(person.id, { brand_status: "suspended" })}
                            >
                              Suspend
                            </button>
                          </>
                        )}
                        {person.role === "brand" && (
                          <>
                            <button
                              type="button"
                              className="button button-quiet !min-h-8 !px-3 text-xs"
                              onClick={() => patchPerson(person.id, { founding_brand: true })}
                            >
                              Founding
                            </button>
                            {(["starter", "growth", "premium"] as const).map((plan) => (
                              <button
                                key={plan}
                                type="button"
                                className={`button !min-h-8 !px-3 text-xs ${
                                  person.plan === plan ? "button-dark" : "button-quiet"
                                }`}
                                onClick={() => patchPerson(person.id, { plan })}
                              >
                                {plan}
                              </button>
                            ))}
                          </>
                        )}
                        {person.role !== "admin" && (
                          <button
                            type="button"
                            className="button button-quiet !min-h-8 !px-3 text-xs"
                            onClick={() =>
                              removePerson(
                                person.id,
                                person.full_name || person.email || "this account"
                              )
                            }
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "applications" && (
        <div className="grid gap-3">
          {applications.length === 0 && (
            <p className="text-sm text-[color:var(--muted)]">No applications yet.</p>
          )}
          {applications.map((app) => (
            <article key={app.id} className="panel border hairline p-5">
              <p className="eyebrow">
                {app.kind} · {app.status}
              </p>
              <pre className="mt-3 overflow-x-auto text-xs text-[color:var(--muted)]">
                {JSON.stringify(app.payload, null, 2)}
              </pre>
              {app.status === "pending" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="button button-dark !min-h-8 !px-3 text-xs"
                    onClick={() => reviewApp(app.id, "approved", app.kind === "brand")}
                  >
                    Approve {app.kind === "brand" ? "+ founding" : ""}
                  </button>
                  <button
                    type="button"
                    className="button button-quiet !min-h-8 !px-3 text-xs"
                    onClick={() => reviewApp(app.id, "approved", false)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="button button-quiet !min-h-8 !px-3 text-xs"
                    onClick={() => reviewApp(app.id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {tab === "reports" && (
        <div className="grid gap-3">
          {reports.length === 0 && <p className="text-sm text-[color:var(--muted)]">No reports.</p>}
          {reports.map((report) => (
            <article key={report.id} className="panel border hairline p-5">
              <p className="text-sm font-semibold">
                {report.target_type} / {report.target_id} · {report.status}
              </p>
              <p className="mt-2 text-sm">{report.reason}</p>
              {report.details && (
                <p className="mt-1 text-xs text-[color:var(--muted)]">{report.details}</p>
              )}
              {report.status === "open" && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="button button-dark !min-h-8 !px-3 text-xs"
                    onClick={() => reviewReport(report.id, "resolved")}
                  >
                    Resolve
                  </button>
                  <button
                    type="button"
                    className="button button-quiet !min-h-8 !px-3 text-xs"
                    onClick={() => reviewReport(report.id, "dismissed")}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {tab === "stylists" && (
        <div className="grid gap-5">
          <p className="text-sm text-[color:var(--muted)]">
            Record a stylist payment. Syllis keeps {Math.round(STYLIST_PLATFORM_CUT * 100)}% in the
            ledger.
          </p>
          <div className="panel grid gap-4 border hairline p-6 md:grid-cols-[1fr_160px_auto]">
            <label className="grid gap-2 text-xs">
              Stylist
              <select
                value={stylistId}
                onChange={(e) => setStylistId(e.target.value)}
                className="border hairline bg-transparent px-3 py-3"
              >
                <option value="">Select</option>
                {stylists.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name || person.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-xs">
              Gross £
              <input
                value={gross}
                onChange={(e) => setGross(e.target.value)}
                className="border hairline bg-transparent px-3 py-3"
              />
            </label>
            <button type="button" className="button button-dark self-end" onClick={payout}>
              Record payout
            </button>
          </div>
        </div>
      )}

      {tab === "lab" && (
        <div className="grid gap-5">
          <p className="max-w-xl text-sm text-[color:var(--muted)]">
            Create a verified founding brand instantly. Catalogue (brands, products, ads) is the
            other tab — hide demo listings or seed fakes there. Then open a private window, log in
            with the details below, and go to Studio.
          </p>
          <button type="button" className="button button-dark w-fit" onClick={createTestBrand} disabled={creating}>
            {creating ? "Creating…" : "Create test brand"}
          </button>
          {testBrand && (
            <div className="panel border hairline p-6">
              <p className="eyebrow">Login</p>
              <p className="mt-4 text-sm">
                Email
                <br />
                <span className="font-semibold">{testBrand.email}</span>
              </p>
              <p className="mt-3 text-sm">
                Password
                <br />
                <span className="font-semibold">{testBrand.password}</span>
              </p>
              <p className="mt-4 text-xs text-[color:var(--muted)]">
                Private window → /login → then /studio. Browse /home first if you want analytics
                numbers to appear.
              </p>
              {testBrand.userId && (
                <button
                  type="button"
                  className="button button-quiet mt-5"
                  onClick={() => removePerson(testBrand.userId!, testBrand.email)}
                >
                  Remove this test brand
                </button>
              )}
            </div>
          )}
          <div className="panel border hairline p-6 text-sm leading-6 text-[color:var(--muted)]">
            <p className="font-semibold text-[color:var(--text)]">Or do it by hand</p>
            <p className="mt-3">1. Private window, /signup, choose Brand, apply.</p>
            <p>2. Back here, Applications, Approve.</p>
            <p>3. In the brand window, open /studio. Listing stays locked until verified — Approve does that.</p>
          </div>
        </div>
      )}
    </div>
  );
}
