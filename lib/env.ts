const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function supabaseUrlValue() {
  return supabaseUrl;
}

export function supabaseKey() {
  return supabasePublishableKey;
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_RESTRICTED_KEY);
}

export function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export function adminEmail() {
  return (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

export function isAdminEmail(email: string | null | undefined) {
  const admin = adminEmail();
  if (!admin || !email) return false;
  return email.trim().toLowerCase() === admin;
}

export function hasServiceRole() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}
