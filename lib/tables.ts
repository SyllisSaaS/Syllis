/** Syllis tables are prefixed so they do not collide with other apps in the same Supabase project. */
export const T = {
  profiles: "syllis_profiles",
  savedItems: "syllis_saved_items",
  events: "syllis_analytics_events",
  reservations: "syllis_reservations",
  layouts: "syllis_analytics_layouts",
  applications: "syllis_applications",
  reports: "syllis_reports",
  ledger: "syllis_ledger",
  payouts: "syllis_stylist_payouts",
  brands: "syllis_brands",
  products: "syllis_products",
  ads: "syllis_ads",
  analyticsResets: "syllis_analytics_resets",
  adBookings: "syllis_ad_bookings",
  stripePrices: "syllis_stripe_prices",
} as const;
