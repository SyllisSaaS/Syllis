"use client";

import { LookToggle } from "@/components/look-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-4">Settings</p>
      <h1 className="text-5xl font-semibold tracking-[-.06em]">Account settings.</h1>
      <div className="mt-10 max-w-2xl space-y-4">
        <div className="panel flex items-center justify-between gap-6 border hairline p-7">
          <div>
            <p className="font-semibold">Look</p>
            <p className="mt-1 text-xs text-[color:var(--muted)]">
              Studio is sharp and black. Colour is rounded and playful. This is saved on your
              device, and on your profile when you are logged in.
            </p>
          </div>
          <LookToggle />
        </div>
        <div className="panel flex items-center justify-between gap-6 border hairline p-7">
          <div>
            <p className="font-semibold">Light / dark</p>
            <p className="mt-1 text-xs text-[color:var(--muted)]">Independent of Studio vs Colour.</p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
