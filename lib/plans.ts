export type AccountRole = "shopper" | "brand" | "stylist" | "admin";
export type ShopperPlan = "free" | "early";
export type BrandPlan = "starter" | "growth" | "premium";
export type PlanId = ShopperPlan | BrandPlan;
export type ChartType = "bar" | "line" | "area" | "donut" | "composed";
export type AnalyticsFidelity = "plain" | "basic" | "advanced";
export type WidgetId =
  | "views"
  | "saves"
  | "clicks"
  | "followers"
  | "drop_interest"
  | "early_conversion"
  | "traffic_over_time"
  | "top_products"
  | "funnel"
  | "heatmap"
  | "conversion"
  | "event_mix"
  | "weekday";

export const TRIAL_DAYS = 7;
export const EARLY_RESERVE_CAP_RATIO = 0.2;
export const RESERVATION_HOLD_MINUTES = 30;

export const ALL_WIDGETS: WidgetId[] = [
  "views",
  "saves",
  "clicks",
  "followers",
  "drop_interest",
  "early_conversion",
  "traffic_over_time",
  "top_products",
  "funnel",
  "heatmap",
  "conversion",
  "event_mix",
  "weekday",
];

export const WIDGET_META: Record<
  WidgetId,
  { label: string; description: string; kind: "stat" | "chart" }
> = {
  views: { label: "Product views", description: "Times people opened your pieces", kind: "stat" },
  saves: { label: "Saves", description: "Pieces added to saved lists", kind: "stat" },
  clicks: { label: "Outbound clicks", description: "Clicks through to your shop", kind: "stat" },
  followers: { label: "Followers", description: "People following the brand", kind: "stat" },
  drop_interest: { label: "Drop interest", description: "Views and reserves on upcoming drops", kind: "stat" },
  early_conversion: {
    label: "Early conversion",
    description: "Early views that became reserves",
    kind: "stat",
  },
  traffic_over_time: { label: "Traffic", description: "Views over the selected range", kind: "chart" },
  top_products: { label: "Top products", description: "Your most viewed pieces", kind: "chart" },
  funnel: { label: "Funnel", description: "Views to saves, clicks and reserves", kind: "chart" },
  heatmap: { label: "Activity heat", description: "When people actually show up", kind: "chart" },
  conversion: { label: "Rates", description: "Save rate, click-through and reserve rate", kind: "chart" },
  event_mix: { label: "Event mix", description: "What kind of actions you are getting", kind: "chart" },
  weekday: { label: "Week pattern", description: "Traffic by day of week", kind: "chart" },
};

export type Entitlements = {
  role: AccountRole;
  name: string;
  price: number;
  productCap: number | null;
  earlyAccess: boolean;
  canReserve: boolean;
  widgets: WidgetId[];
  chartTypes: ChartType[];
  layout: "fixed" | "pick" | "builder";
  fidelity: AnalyticsFidelity;
  dateRange: boolean;
  exportCsv: boolean;
  comparison: boolean;
  readOnlyWhenLapsed: boolean;
  customBanner: boolean;
};

export const shopperPlans = [
  {
    id: "free" as const,
    name: "Free",
    price: 0,
    description: "The full Syllis discovery experience without early access.",
    features: [
      "Browse every listed brand and product",
      "Save products and brands",
      "Standard drop access",
      "No subscription fee",
    ],
  },
  {
    id: "early" as const,
    name: "Early",
    price: 4,
    description: "A low-cost upgrade for people who want first access to selected drops.",
    features: [
      "Everything in Free",
      "Selected drops shown 7 days early",
      "Reserve a capped slice of drop stock",
      "Early-access notifications",
      "7-day free trial",
    ],
  },
];

export const brandPlans = [
  {
    id: "starter" as const,
    name: "Starter",
    price: 12,
    description: "For a small label getting its first products onto Syllis.",
    products: 15,
    features: [
      "Up to 15 live products",
      "Profile photo and a plain colour banner",
      "Plain-text analytics and a simple bar log",
      "Standard discovery placement",
      "7-day free trial",
    ],
  },
  {
    id: "growth" as const,
    name: "Growth",
    price: 29,
    description: "For brands ready to scale their catalogue and reach.",
    products: 75,
    features: [
      "Up to 75 live products",
      "Custom banner photo and profile photo",
      "Basic analytics: stat cards, bar or line",
      "Date range and widget picker",
      "Drop scheduling",
      "Early-access controls",
      "7-day free trial",
    ],
  },
  {
    id: "premium" as const,
    name: "Premium",
    price: 59,
    description: "For established independent brands that want maximum control.",
    products: 250,
    features: [
      "Up to 250 live products",
      "Custom banner photo and profile photo",
      "Advanced analytics: funnels, heatmaps, rates",
      "Dashboard builder, comparison, CSV export",
      "Stacked, area, donut and composed charts",
      "Drop scheduling + reservations",
      "7-day free trial",
    ],
  },
];

const ENTITLEMENTS: Record<PlanId, Entitlements> = {
  free: {
    role: "shopper",
    name: "Free",
    price: 0,
    productCap: null,
    earlyAccess: false,
    canReserve: false,
    widgets: [],
    chartTypes: [],
    layout: "fixed",
    fidelity: "plain",
    dateRange: false,
    exportCsv: false,
    comparison: false,
    readOnlyWhenLapsed: false,
    customBanner: false,
  },
  early: {
    role: "shopper",
    name: "Early",
    price: 4,
    productCap: null,
    earlyAccess: true,
    canReserve: true,
    widgets: [],
    chartTypes: [],
    layout: "fixed",
    fidelity: "plain",
    dateRange: false,
    exportCsv: false,
    comparison: false,
    readOnlyWhenLapsed: false,
    customBanner: false,
  },
  starter: {
    role: "brand",
    name: "Starter",
    price: 12,
    productCap: 15,
    earlyAccess: false,
    canReserve: false,
    widgets: ["views", "saves", "clicks", "traffic_over_time"],
    chartTypes: [],
    layout: "fixed",
    fidelity: "plain",
    dateRange: false,
    exportCsv: false,
    comparison: false,
    readOnlyWhenLapsed: true,
    customBanner: false,
  },
  growth: {
    role: "brand",
    name: "Growth",
    price: 29,
    productCap: 75,
    earlyAccess: true,
    canReserve: false,
    widgets: [
      "views",
      "saves",
      "clicks",
      "followers",
      "drop_interest",
      "traffic_over_time",
      "top_products",
    ],
    chartTypes: ["bar", "line"],
    layout: "pick",
    fidelity: "basic",
    dateRange: true,
    exportCsv: false,
    comparison: false,
    readOnlyWhenLapsed: true,
    customBanner: true,
  },
  premium: {
    role: "brand",
    name: "Premium",
    price: 59,
    productCap: 250,
    earlyAccess: true,
    canReserve: true,
    widgets: ALL_WIDGETS,
    chartTypes: ["bar", "line", "area", "donut", "composed"],
    layout: "builder",
    fidelity: "advanced",
    dateRange: true,
    exportCsv: true,
    comparison: true,
    readOnlyWhenLapsed: true,
    customBanner: true,
  },
};

export function isPlanId(value: unknown): value is PlanId {
  return (
    value === "free" ||
    value === "early" ||
    value === "starter" ||
    value === "growth" ||
    value === "premium"
  );
}

export function isBrandPlan(value: unknown): value is BrandPlan {
  return value === "starter" || value === "growth" || value === "premium";
}

export function getEntitlements(plan: PlanId): Entitlements {
  return ENTITLEMENTS[plan];
}

export function trialEndDate(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d;
}

export function isTrialActive(trialEndsAt: string | Date | null | undefined) {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt).getTime() > Date.now();
}
