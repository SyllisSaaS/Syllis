"use client";

import { lookLabel, type Look } from "@/lib/look";
import { useLook } from "./look-provider";

export function LookToggle() {
  const { look, setLook } = useLook();
  const next: Look = look === "studio" ? "colour" : "studio";

  return (
    <button
      type="button"
      onClick={() => setLook(next)}
      className="button button-quiet !min-h-9 !px-3 text-[10px] uppercase tracking-[.12em]"
      aria-label={`Switch to ${lookLabel(next)} look`}
      data-cursor="LOOK"
    >
      {lookLabel(look)}
    </button>
  );
}
