import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseKey } from "@/lib/env";

export function createClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, supabaseKey());
}
