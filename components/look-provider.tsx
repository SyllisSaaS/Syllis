"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOOK,
  LOOK_COOKIE,
  LOOK_STORAGE_KEY,
  isLook,
  type Look,
} from "@/lib/look";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/tables";

type LookContextValue = {
  look: Look;
  setLook: (look: Look) => void;
};

const LookContext = createContext<LookContextValue | null>(null);

function readStoredLook(): Look {
  if (typeof window === "undefined") return DEFAULT_LOOK;
  try {
    const stored = window.localStorage.getItem(LOOK_STORAGE_KEY);
    if (isLook(stored)) return stored;
  } catch {
    // Ignore blocked storage.
  }
  const match = document.cookie.match(/(?:^|; )syllis-look=([^;]+)/);
  const cookie = match?.[1];
  return isLook(cookie) ? cookie : DEFAULT_LOOK;
}

function persistLook(look: Look) {
  document.documentElement.dataset.look = look;
  try {
    window.localStorage.setItem(LOOK_STORAGE_KEY, look);
  } catch {
    // Ignore blocked storage.
  }
  document.cookie = `${LOOK_COOKIE}=${look}; path=/; max-age=31536000; SameSite=Lax`;
}

export function LookProvider({
  children,
  initialLook = DEFAULT_LOOK,
}: {
  children: React.ReactNode;
  initialLook?: Look;
}) {
  const [look, setLookState] = useState<Look>(initialLook);

  useEffect(() => {
    const stored = readStoredLook();
    setLookState(stored);
    persistLook(stored);
  }, []);

  const setLook = useCallback((next: Look) => {
    setLookState(next);
    persistLook(next);

    if (!isSupabaseConfigured()) return;
    void (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from(T.profiles).update({ look: next }).eq("id", user.id);
      } catch {
        // Look still works locally if the profile column is missing.
      }
    })();
  }, []);

  const value = useMemo(() => ({ look, setLook }), [look, setLook]);

  return <LookContext.Provider value={value}>{children}</LookContext.Provider>;
}

export function useLook() {
  const ctx = useContext(LookContext);
  if (!ctx) {
    throw new Error("useLook must be used within LookProvider");
  }
  return ctx;
}
