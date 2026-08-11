"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-4">Settings</p>
      <h1 className="text-5xl font-semibold tracking-[-.06em]">Account settings.</h1>
      <div className="mt-10 max-w-2xl border hairline p-7">
        <label className="flex items-center justify-between gap-6 text-sm">
          <span>
            <span className="block font-semibold">Early drop notifications</span>
            <span className="mt-1 block text-xs text-[color:var(--muted)]">Demo preference only.</span>
          </span>
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
        </label>
      </div>
    </div>
  );
}
