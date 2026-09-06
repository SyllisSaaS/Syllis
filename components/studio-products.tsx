"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ImageRepositioner, uploadMedia } from "@/components/image-frame";
import { styles } from "@/lib/data";

type Piece = {
  id: string;
  slug: string;
  name: string;
  price: number;
  category: string;
  style: string;
  image: string;
  description: string;
  live: boolean;
  image_x?: number;
  image_y?: number;
};

const empty = {
  name: "",
  price: "",
  category: "Apparel",
  style: "Minimal",
  description: "",
  image: "",
  image_x: 50,
  image_y: 50,
  live: true,
};

export function StudioProducts() {
  const [products, setProducts] = useState<Piece[]>([]);
  const [cap, setCap] = useState<number | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/studio/products");
    const data = (await res.json()) as { products?: Piece[]; cap?: number | null; error?: string };
    if (!res.ok) {
      setError(data.error || "Could not load pieces.");
      setLoading(false);
      return;
    }
    setProducts(data.products ?? []);
    setCap(data.cap ?? null);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addPiece(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/studio/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: Number(form.price || 0),
      }),
    });
    const data = (await res.json()) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not add that piece.");
      return;
    }
    setForm(empty);
    await load();
  }

  async function toggleLive(piece: Piece) {
    await fetch("/api/studio/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: piece.id, live: !piece.live }),
    });
    await load();
  }

  async function remove(piece: Piece) {
    if (!confirm(`Remove ${piece.name}?`)) return;
    await fetch("/api/studio/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: piece.id }),
    });
    await load();
  }

  return (
    <section className="panel border hairline p-7">
      <p className="eyebrow">Catalogue</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em]">Your pieces</h2>
      <p className="mt-2 max-w-xl text-xs leading-5 text-[color:var(--muted)]">
        Upload a photo, drag it so the crop looks right, then publish. Live pieces appear on Discover and your
        brand page.
        {cap != null ? ` This plan can list ${cap} pieces (${products.length} used).` : ""}
      </p>

      <form onSubmit={addPiece} className="mt-8 grid gap-5 border-t hairline pt-8 md:grid-cols-[220px_1fr]">
        <ImageRepositioner
          src={form.image || null}
          x={form.image_x}
          y={form.image_y}
          shape="portrait"
          label="Piece photo"
          hint="Portrait crop. Drag to frame the garment."
          onChange={(next) => setForm({ ...form, image_x: next.x, image_y: next.y })}
          onUpload={async (file) => {
            const url = await uploadMedia("product", file);
            setForm((current) => ({ ...current, image: url, image_x: 50, image_y: 50 }));
          }}
        />

        <div className="grid gap-4">
          <label className="grid gap-2 text-xs">
            Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border hairline bg-transparent px-3 py-3 outline-none"
              placeholder="Washed heavy zip"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-xs">
              Price £
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="border hairline bg-transparent px-3 py-3 outline-none"
              />
            </label>
            <label className="grid gap-2 text-xs">
              Category
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="border hairline bg-transparent px-3 py-3 outline-none"
              />
            </label>
            <label className="grid gap-2 text-xs">
              Niche
              <select
                value={form.style}
                onChange={(e) => setForm({ ...form, style: e.target.value })}
                className="border hairline bg-transparent px-3 py-3 outline-none"
              >
                {styles.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="grid gap-2 text-xs">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="min-h-20 border hairline bg-transparent px-3 py-3 outline-none"
              placeholder="Fabric, fit, why it exists."
            />
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={form.live} onChange={(e) => setForm({ ...form, live: e.target.checked })} />
            Show on the public site now
          </label>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" className="button button-dark w-fit" disabled={saving}>
            {saving ? "Adding…" : "Add piece"}
          </button>
        </div>
      </form>

      <div className="mt-10 border-t hairline pt-6">
        {loading ? (
          <p className="text-sm text-[color:var(--muted)]">Loading pieces…</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No pieces yet. Add the first one above.</p>
        ) : (
          <ul className="grid gap-3">
            {products.map((piece) => (
              <li key={piece.id} className="flex flex-wrap items-center gap-4 border hairline p-3">
                <div className="h-16 w-12 overflow-hidden bg-[color:var(--surface)]">
                  {piece.image ? (
                    <img src={piece.image} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{piece.name}</p>
                  <p className="text-xs text-[color:var(--muted)]">
                    £{piece.price} · {piece.style} · {piece.live ? "Live" : "Hidden"}
                  </p>
                </div>
                <Link href={`/product/${piece.slug}`} className="text-xs underline underline-offset-4">
                  Open
                </Link>
                <button type="button" className="text-xs underline underline-offset-4" onClick={() => void toggleLive(piece)}>
                  {piece.live ? "Hide" : "Publish"}
                </button>
                <button type="button" className="text-xs underline underline-offset-4" onClick={() => void remove(piece)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
