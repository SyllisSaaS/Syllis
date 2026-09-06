export type ImageFocus = { x: number; y: number };

export const BANNER_COLORS = [
  { id: "ink", hex: "#141414", label: "Ink" },
  { id: "stone", hex: "#cfc6b8", label: "Stone" },
  { id: "clay", hex: "#8a4a32", label: "Clay" },
  { id: "moss", hex: "#3d4a3a", label: "Moss" },
  { id: "navy", hex: "#1c2433", label: "Navy" },
  { id: "wine", hex: "#5a2430", label: "Wine" },
  { id: "sand", hex: "#d4b896", label: "Sand" },
  { id: "olive", hex: "#6b6b3a", label: "Olive" },
] as const;

export const DEFAULT_BANNER = BANNER_COLORS[0].hex;
export const MEDIA_BUCKET = "syllis-media";
export const APPEARANCE_SQL_HINT =
  "Paste supabase/appearance.sql into the Supabase SQL editor, then refresh. It only adds Syllis columns and the syllis-media bucket.";

export function clampFocus(value: unknown, fallback = 50) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, n));
}

export function objectPosition(x?: number | null, y?: number | null) {
  return `${clampFocus(x)}% ${clampFocus(y)}%`;
}

export function isBannerColor(value: string) {
  return BANNER_COLORS.some((color) => color.hex.toLowerCase() === value.trim().toLowerCase());
}

export function isMissingColumn(error: { message?: string; code?: string } | null | undefined) {
  if (!error) return false;
  const message = (error.message || "").toLowerCase();
  return (
    error.code === "PGRST204" ||
    message.includes("could not find the") ||
    message.includes("schema cache") ||
    message.includes("column")
  );
}
