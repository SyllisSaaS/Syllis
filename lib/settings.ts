import { T } from "@/lib/tables";
import { createServiceClient } from "@/lib/supabase/service";

const SETTINGS_SQL =
  "Paste supabase/tracking.sql into the Supabase SQL editor. It adds the settings table used to store the Aftership key.";

export async function getSetting(key: string) {
  const envHit =
    key === "aftership_api_key"
      ? (process.env.AFTERSHIP_API_KEY || "").trim()
      : key === "easypost_api_key"
        ? (process.env.EASYPOST_API_KEY || "").trim()
        : "";
  if (envHit) return envHit;

  const supabase = createServiceClient();
  if (!supabase) return "";
  const { data, error } = await supabase.from(T.settings).select("value").eq("key", key).maybeSingle();
  if (error) {
    if (process.env.NODE_ENV !== "production") console.error(SETTINGS_SQL);
    return "";
  }
  return typeof data?.value === "string" ? data.value.trim() : "";
}

export async function setSetting(key: string, value: string) {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Service role is required to save settings.");
  const { error } = await supabase.from(T.settings).upsert({
    key,
    value: value.trim(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(SETTINGS_SQL);
}

export async function trackingProviderKeys() {
  const [aftership, easypost] = await Promise.all([
    getSetting("aftership_api_key"),
    getSetting("easypost_api_key"),
  ]);
  return { aftership, easypost };
}
