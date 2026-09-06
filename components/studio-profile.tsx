"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BANNER_COLORS } from "@/lib/appearance";
import { ImageRepositioner, uploadMedia } from "@/components/image-frame";
import { styles } from "@/lib/data";

type BrandRow = {
  slug?: string;
  name?: string;
  niche?: string;
  location?: string;
  description?: string;
  avatar_url?: string | null;
  avatar_x?: number;
  avatar_y?: number;
  banner_mode?: string;
  banner_color?: string;
  banner_url?: string | null;
  banner_x?: number;
  banner_y?: number;
};

export function StudioProfile({ customBanner }: { customBanner: boolean }) {
  const [brand, setBrand] = useState<BrandRow | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/studio/brand");
    const data = (await res.json()) as { brand?: BrandRow; error?: string };
    if (!res.ok) {
      setError(data.error || "Could not load brand profile.");
      setLoading(false);
      return;
    }
    setBrand(data.brand ?? {});
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(patch: Partial<BrandRow>) {
    if (!brand) return;
    setSaving(true);
    setError("");
    setSaved("");
    const res = await fetch("/api/studio/brand", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...brand, ...patch }),
    });
    const data = (await res.json()) as { brand?: BrandRow; error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save.");
      return;
    }
    setBrand(data.brand ?? { ...brand, ...patch });
    setSaved("Saved.");
  }

  if (loading) return <p className="text-sm text-[color:var(--muted)]">Loading your public profile…</p>;
  if (!brand) return <p className="text-sm text-red-500">{error}</p>;

  const color = brand.banner_color || BANNER_COLORS[0].hex;
  const mode = customBanner && brand.banner_mode === "image" ? "image" : "color";

  return (
    <section className="panel border hairline p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Public profile</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em]">How shoppers see you</h2>
          <p className="mt-2 max-w-xl text-xs leading-5 text-[color:var(--muted)]">
            This is your brand page on Syllis. A profile photo is included on every plan. Starter banners are
            plain colours. Growth and Premium can upload a banner photo and drag it into place.
          </p>
        </div>
        {brand.slug && (
          <Link href={`/brands/${brand.slug}`} className="button button-quiet">
            View public page
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr]">
        <ImageRepositioner
          src={brand.avatar_url}
          x={Number(brand.avatar_x ?? 50)}
          y={Number(brand.avatar_y ?? 50)}
          shape="circle"
          label="Profile photo"
          hint="Shown on your brand page and in the directory."
          onChange={(next) => setBrand({ ...brand, avatar_x: next.x, avatar_y: next.y })}
          onUpload={async (file) => {
            const url = await uploadMedia("avatar", file);
            await save({ avatar_url: url, avatar_x: 50, avatar_y: 50 });
          }}
        />

        <div className="grid gap-4">
          <label className="grid gap-2 text-xs">
            Brand name
            <input
              value={brand.name ?? ""}
              onChange={(e) => setBrand({ ...brand, name: e.target.value })}
              className="border hairline bg-transparent px-3 py-3 outline-none"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-xs">
              Niche
              <select
                value={brand.niche || "Minimal"}
                onChange={(e) => setBrand({ ...brand, niche: e.target.value })}
                className="border hairline bg-transparent px-3 py-3 outline-none"
              >
                {styles.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-xs">
              Location
              <input
                value={brand.location ?? ""}
                onChange={(e) => setBrand({ ...brand, location: e.target.value })}
                className="border hairline bg-transparent px-3 py-3 outline-none"
                placeholder="London"
              />
            </label>
          </div>
          <label className="grid gap-2 text-xs">
            About the label
            <textarea
              value={brand.description ?? ""}
              onChange={(e) => setBrand({ ...brand, description: e.target.value })}
              className="min-h-24 border hairline bg-transparent px-3 py-3 outline-none"
              placeholder="A short note shoppers will read on your page."
            />
          </label>
        </div>
      </div>

      <div className="mt-10 border-t hairline pt-8">
        <p className="text-sm font-semibold">Banner</p>
        <p className="mt-1 text-xs text-[color:var(--muted)]">
          {customBanner
            ? "Pick a colour or upload a photo. Drag a photo to crop it."
            : "Starter uses a plain colour banner. Upgrade to Growth to upload your own photo."}
        </p>

        {customBanner && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className={`button ${mode === "color" ? "button-dark" : "button-quiet"}`}
              onClick={() => setBrand({ ...brand, banner_mode: "color" })}
            >
              Colour
            </button>
            <button
              type="button"
              className={`button ${mode === "image" ? "button-dark" : "button-quiet"}`}
              onClick={() => setBrand({ ...brand, banner_mode: "image" })}
            >
              Photo
            </button>
          </div>
        )}

        {mode === "color" ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {BANNER_COLORS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setBrand({ ...brand, banner_mode: "color", banner_color: item.hex })}
                className="grid gap-2"
                title={item.label}
              >
                <span
                  className="h-12 w-12 border"
                  style={{
                    background: item.hex,
                    outline: color === item.hex ? "2px solid var(--text)" : "1px solid var(--line)",
                  }}
                />
                <span className="text-[10px] uppercase tracking-[.12em] text-[color:var(--muted)]">{item.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <ImageRepositioner
              src={brand.banner_url}
              x={Number(brand.banner_x ?? 50)}
              y={Number(brand.banner_y ?? 50)}
              shape="banner"
              label="Banner photo"
              hint="Wide crop. Drag to get the composition right."
              onChange={(next) => setBrand({ ...brand, banner_x: next.x, banner_y: next.y })}
              onUpload={async (file) => {
                const url = await uploadMedia("banner", file);
                await save({ banner_mode: "image", banner_url: url, banner_x: 50, banner_y: 50 });
              }}
            />
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="button" className="button button-dark" disabled={saving} onClick={() => void save({})}>
          {saving ? "Saving…" : "Save profile"}
        </button>
        {saved && <p className="text-xs text-[color:var(--muted)]">{saved}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </section>
  );
}
