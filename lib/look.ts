export const LOOKS = ["studio", "colour"] as const;
export type Look = (typeof LOOKS)[number];

export const LOOK_STORAGE_KEY = "syllis-look";
export const LOOK_COOKIE = "syllis-look";
export const DEFAULT_LOOK: Look = "colour";

export function isLook(value: unknown): value is Look {
  return value === "studio" || value === "colour";
}

export function lookLabel(look: Look) {
  return look === "studio" ? "Studio" : "Colour";
}
