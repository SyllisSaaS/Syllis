"use client";

import { useEffect, useState } from "react";
import { styles, type AdPlacement, type StyleName } from "@/lib/data";
import { placementOptions } from "@/lib/ads";
import type { AdminAd, AdminBrand, AdminCatalogue, AdminProduct } from "@/lib/catalogue";

type Payload = AdminCatalogue & { error?: string; message?: string; ok?: boolean };

export function AdminCatalogue() {
  const [data, setData] = useState<AdminCatalogue | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [niches, setNiches] = useState<StyleName[]>(["Washed", "Techwear", "Utility"]);
  const [count, setCount] = useState(4);
  const [withAds, setWithAds] = useState(true);
  const [brandName, setBrandName] = useState("");
  const [brandNiche, setBrandNiche] = useState<StyleName>("Washed");
  const [brandLocation, setBrandLocation] = useState("");
  const [brandImage, setBrandImage] = useState("");
  const [productName, setProductName] = useState("");
  const [productLabel, setProductLabel] = useState("");
  const [productPrice, setProductPrice] = useState("90");
  const [productStyle, setProductStyle] = useState<StyleName>("Washed");
  const [productImage, setProductImage] = useState("");
  const [adTitle, setAdTitle] = useState("");
  const [adBrand, setAdBrand] = useState("");
  const [adPlacement, setAdPlacement] = useState<AdPlacement>("All");
  const [adImage, setAdImage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/catalogue");
    const payload = (await response.json()) as Payload;
    if (payload.error && !payload.tablesReady) {
      setMessage(payload.error);
      setData({ products: [], brands: [], ads: [], tablesReady: false });
      return;
    }
    setData(payload);
  }

  useEffect(() => {
    void load();
  }, []);

  async function run(body: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/catalogue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as Payload;
    setBusy(false);
    setMessage(payload.error || payload.message || "Updated.");
    if (!payload.error) {
      setData(payload);
    } else if (payload.tablesReady === false) {
      setData({ products: [], brands: [], ads: [], tablesReady: false });
    }
  }

  function toggleNiche(style: StyleName) {
    setNiches((current) =>
      current.includes(style) ? current.filter((item) => item !== style) : [...current, style]
    );
  }

  const ready = data?.tablesReady !== false;
  const liveBrands = data?.brands.filter((row) => row.live).length ?? 0;
  const liveProducts = data?.products.filter((row) => row.live).length ?? 0;
  const liveAds = data?.ads.filter((row) => row.live).length ?? 0;

  return (
    <div className="grid gap-6">
      {message && <p className="text-sm">{message}</p>}

      {!ready && (
        <div className="panel border hairline p-6 text-sm leading-6">
          <p className="font-semibold">Catalogue tables are not in the database yet.</p>
          <p className="mt-2 text-[color:var(--muted)]">
            In Supabase SQL editor, paste the Catalogue section at the bottom of{" "}
            <code>supabase/schema.sql</code> (tables <code>syllis_brands</code>,{" "}
            <code>syllis_products</code>, <code>syllis_ads</code>). Safe to re-run. Then refresh.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel border hairline p-5">
          <p className="text-xs text-[color:var(--muted)]">Live brands</p>
          <p className="mt-2 text-3xl font-semibold">{liveBrands}</p>
        </div>
        <div className="panel border hairline p-5">
          <p className="text-xs text-[color:var(--muted)]">Live products</p>
          <p className="mt-2 text-3xl font-semibold">{liveProducts}</p>
        </div>
        <div className="panel border hairline p-5">
          <p className="text-xs text-[color:var(--muted)]">Live ads</p>
          <p className="mt-2 text-3xl font-semibold">{liveAds}</p>
        </div>
      </div>

      <div className="panel border hairline p-5 md:p-7">
        <p className="eyebrow">Demo and fakes</p>
        <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
          Public pages only show listings marked live. The original Unsplash demo is off until you
          load it. Fakes are labelled as test pieces so you can try ads and filters without signing
          a real label.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className="button button-dark !min-h-9 !px-3 text-xs" disabled={busy} onClick={() => run({ action: "seed-demo" })}>
            Load original demo pack
          </button>
          <button type="button" className="button button-quiet !min-h-9 !px-3 text-xs" disabled={busy} onClick={() => run({ action: "set-source-live", source: "demo", live: false })}>
            Hide demo
          </button>
          <button type="button" className="button button-quiet !min-h-9 !px-3 text-xs" disabled={busy} onClick={() => run({ action: "set-source-live", source: "demo", live: true })}>
            Show demo
          </button>
          <button type="button" className="button button-quiet !min-h-9 !px-3 text-xs" disabled={busy} onClick={() => run({ action: "clear", source: "demo" })}>
            Delete demo
          </button>
          <button type="button" className="button button-quiet !min-h-9 !px-3 text-xs" disabled={busy} onClick={() => run({ action: "clear", source: "seed" })}>
            Delete fakes
          </button>
          <button type="button" className="button button-quiet !min-h-9 !px-3 text-xs" disabled={busy} onClick={() => run({ action: "clear", source: "all" })}>
            Empty catalogue
          </button>
        </div>
      </div>

      <div className="panel border hairline p-5 md:p-7">
        <p className="eyebrow">Seed fake products by niche</p>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Pick niches and a count. Each niche gets its own fake brand. Turn on ads to drop a
          sponsored slot on All plus each selected style.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {styles.map((style) => (
            <button
              key={style}
              type="button"
              className={`button !min-h-9 !px-3 text-xs ${niches.includes(style) ? "button-dark" : "button-quiet"}`}
              onClick={() => toggleNiche(style)}
            >
              {style}
            </button>
          ))}
        </div>
        <label className="mt-5 flex items-center gap-3 text-xs text-[color:var(--muted)]">
          {count} per niche
          <input
            className="range"
            type="range"
            min={1}
            max={12}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={withAds} onChange={(e) => setWithAds(e.target.checked)} />
          Include test ads
        </label>
        <button
          type="button"
          className="button button-dark mt-5 w-fit"
          disabled={busy || niches.length === 0}
          onClick={() => run({ action: "seed-fakes", niches, count, ads: withAds })}
        >
          Seed {niches.length * count} fake pieces
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <form
          className="panel grid gap-3 border hairline p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void run({
              action: "upsert-brand",
              name: brandName,
              niche: brandNiche,
              location: brandLocation,
              image: brandImage,
              featured: true,
            });
            setBrandName("");
          }}
        >
          <p className="text-xs font-semibold">Add a real brand</p>
          <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Brand name" className="border hairline bg-transparent px-3 py-2 text-sm" />
          <select value={brandNiche} onChange={(e) => setBrandNiche(e.target.value as StyleName)} className="border hairline bg-transparent px-3 py-2 text-sm">
            {styles.map((style) => (
              <option key={style}>{style}</option>
            ))}
          </select>
          <input value={brandLocation} onChange={(e) => setBrandLocation(e.target.value)} placeholder="City" className="border hairline bg-transparent px-3 py-2 text-sm" />
          <input value={brandImage} onChange={(e) => setBrandImage(e.target.value)} placeholder="Image URL" className="border hairline bg-transparent px-3 py-2 text-sm" />
          <button type="submit" className="button button-dark !min-h-9 text-xs" disabled={busy}>
            Save brand
          </button>
        </form>

        <form
          className="panel grid gap-3 border hairline p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void run({
              action: "upsert-product",
              name: productName,
              label: productLabel || brandName,
              price: Number(productPrice),
              style: productStyle,
              image: productImage,
              featured: true,
            });
            setProductName("");
          }}
        >
          <p className="text-xs font-semibold">Add a real product</p>
          <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Piece name" className="border hairline bg-transparent px-3 py-2 text-sm" />
          <input value={productLabel} onChange={(e) => setProductLabel(e.target.value)} placeholder="Brand label" className="border hairline bg-transparent px-3 py-2 text-sm" />
          <input value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder="Price" className="border hairline bg-transparent px-3 py-2 text-sm" />
          <select value={productStyle} onChange={(e) => setProductStyle(e.target.value as StyleName)} className="border hairline bg-transparent px-3 py-2 text-sm">
            {styles.map((style) => (
              <option key={style}>{style}</option>
            ))}
          </select>
          <input value={productImage} onChange={(e) => setProductImage(e.target.value)} placeholder="Image URL" className="border hairline bg-transparent px-3 py-2 text-sm" />
          <button type="submit" className="button button-dark !min-h-9 text-xs" disabled={busy}>
            Save product
          </button>
        </form>

        <form
          className="panel grid gap-3 border hairline p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void run({
              action: "upsert-ad",
              title: adTitle,
              brand: adBrand,
              placement: adPlacement,
              image: adImage,
            });
            setAdTitle("");
          }}
        >
          <p className="text-xs font-semibold">Add a test ad</p>
          <input value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder="Ad title" className="border hairline bg-transparent px-3 py-2 text-sm" />
          <input value={adBrand} onChange={(e) => setAdBrand(e.target.value)} placeholder="Advertiser" className="border hairline bg-transparent px-3 py-2 text-sm" />
          <select value={adPlacement} onChange={(e) => setAdPlacement(e.target.value as AdPlacement)} className="border hairline bg-transparent px-3 py-2 text-sm">
            {placementOptions().map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All Syllis" : item === "Brand" ? "Brand slot" : item === "Drop" ? "Drop slot" : item}
              </option>
            ))}
          </select>
          <input value={adImage} onChange={(e) => setAdImage(e.target.value)} placeholder="Image URL" className="border hairline bg-transparent px-3 py-2 text-sm" />
          <button type="submit" className="button button-dark !min-h-9 text-xs" disabled={busy}>
            Save ad
          </button>
        </form>
      </div>

      <ListingTable
        title="Brands"
        rows={data?.brands ?? []}
        busy={busy}
        onLive={(id, live) => run({ action: "set-live", table: "brands", id, live })}
        onDelete={(id) => run({ action: "delete", table: "brands", id })}
        detail={(row: AdminBrand) => `${row.niche} · ${row.location} · ${row.products} pieces`}
      />
      <ListingTable
        title="Products"
        rows={data?.products ?? []}
        busy={busy}
        onLive={(id, live) => run({ action: "set-live", table: "products", id, live })}
        onDelete={(id) => run({ action: "delete", table: "products", id })}
        detail={(row: AdminProduct) => `${row.label} · ${row.style} · £${row.price}`}
      />
      <ListingTable
        title="Ads"
        rows={data?.ads ?? []}
        busy={busy}
        onLive={(id, live) => run({ action: "set-live", table: "ads", id, live })}
        onDelete={(id) => run({ action: "delete", table: "ads", id })}
        detail={(row: AdminAd) => `${row.brand} · ${row.placement === "All" ? "All Syllis" : `${row.placement} niche`} · ${row.days}d`}
      />
    </div>
  );
}

function ListingTable<T extends { id: string; name?: string; title?: string; live: boolean; source: string }>({
  title,
  rows,
  busy,
  onLive,
  onDelete,
  detail,
}: {
  title: string;
  rows: T[];
  busy: boolean;
  onLive: (id: string, live: boolean) => void;
  onDelete: (id: string) => void;
  detail: (row: T) => string;
}) {
  return (
    <div className="panel overflow-x-auto border hairline">
      <p className="px-4 pt-4 text-xs font-semibold">
        {title} ({rows.length})
      </p>
      {rows.length === 0 ? (
        <p className="p-4 text-sm text-[color:var(--muted)]">None yet.</p>
      ) : (
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[.12em] text-[color:var(--muted)]">
            <tr>
              <th className="p-4">Item</th>
              <th className="p-4">Source</th>
              <th className="p-4">Public</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t hairline">
                <td className="p-4">
                  <p className="font-semibold">{row.name || row.title}</p>
                  <p className="text-xs text-[color:var(--muted)]">{detail(row)}</p>
                </td>
                <td className="p-4 capitalize">{row.source}</td>
                <td className="p-4">{row.live ? "Live" : "Hidden"}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="button button-quiet !min-h-8 !px-3 text-xs"
                      disabled={busy}
                      onClick={() => onLive(row.id, !row.live)}
                    >
                      {row.live ? "Hide" : "Publish"}
                    </button>
                    <button
                      type="button"
                      className="button button-quiet !min-h-8 !px-3 text-xs"
                      disabled={busy}
                      onClick={() => onDelete(row.id)}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
