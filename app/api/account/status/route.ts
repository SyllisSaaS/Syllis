import { isStripeConfigured, isSupabaseConfigured } from "@/lib/env";

export function GET() {
  return Response.json({
    supabase: isSupabaseConfigured(),
    stripe: isStripeConfigured(),
  });
}
