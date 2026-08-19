"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const dark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="button button-quiet !min-h-9 !px-3"
      aria-label="Toggle theme"
      data-cursor="THEME"
    >
      {dark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
