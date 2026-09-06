"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LookToggle } from "@/components/look-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { ImageRepositioner, uploadMedia } from "@/components/image-frame";

type Me = {
  name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  avatar_x: number;
  avatar_y: number;
  role: string | null;
};

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/account/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setMe(data as Me);
      })
      .catch(() => undefined);
  }, []);

  async function save(patch: Partial<Me> = {}) {
    if (!me) return;
    setSaving(true);
    setError("");
    setSaved("");
    const res = await fetch("/api/account/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...me, ...patch }),
    });
    const data = (await res.json()) as Me & { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save.");
      return;
    }
    setMe(data);
    setSaved("Saved.");
  }

  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-4">Settings</p>
      <h1 className="text-5xl font-semibold tracking-[-.06em]">Account settings.</h1>
      <p className="mt-4 max-w-xl text-sm text-[color:var(--muted)]">
        Your photo and name show on your profile. Brands also edit their public page in Studio.
      </p>

      <div className="mt-10 max-w-2xl space-y-4">
        {me && (
          <div className="panel border hairline p-7">
            <ImageRepositioner
              src={me.avatar_url}
              x={me.avatar_x ?? 50}
              y={me.avatar_y ?? 50}
              shape="circle"
              label="Profile photo"
              hint="Upload, then drag to centre your face or logo."
              onChange={(next) => setMe({ ...me, avatar_x: next.x, avatar_y: next.y })}
              onUpload={async (file) => {
                const url = await uploadMedia("avatar", file);
                await save({ avatar_url: url, avatar_x: 50, avatar_y: 50 });
              }}
            />
            <div className="mt-8 grid gap-4">
              <label className="grid gap-2 text-xs">
                Name
                <input
                  value={me.name ?? ""}
                  onChange={(e) => setMe({ ...me, name: e.target.value })}
                  className="border hairline bg-transparent px-3 py-3 outline-none"
                />
              </label>
              <label className="grid gap-2 text-xs">
                Username
                <input
                  value={me.username ?? ""}
                  onChange={(e) => setMe({ ...me, username: e.target.value })}
                  className="border hairline bg-transparent px-3 py-3 outline-none"
                  placeholder="yourname"
                />
              </label>
              <label className="grid gap-2 text-xs">
                Bio
                <textarea
                  value={me.bio ?? ""}
                  onChange={(e) => setMe({ ...me, bio: e.target.value })}
                  className="min-h-24 border hairline bg-transparent px-3 py-3 outline-none"
                  placeholder="A short line about you."
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="button button-dark" disabled={saving} onClick={() => void save()}>
                  {saving ? "Saving…" : "Save profile"}
                </button>
                {me.role === "brand" && (
                  <Link href="/studio" className="button button-quiet">
                    Edit brand page
                  </Link>
                )}
                {saved && <p className="text-xs text-[color:var(--muted)]">{saved}</p>}
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>
            </div>
          </div>
        )}

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
