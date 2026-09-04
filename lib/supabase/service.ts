import { createClient as createJsClient } from "@supabase/supabase-js";
import { hasServiceRole } from "@/lib/env";

export function createServiceClient() {
  if (!hasServiceRole()) return null;
  return createJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
