import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { findLiveProduct } from "@/lib/catalogue";
import { dropForProduct } from "@/lib/drops";
import { Track } from "@/components/track";
import { ProductActions } from "@/components/product-actions";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await findLiveProduct(slug);

  if (!product) notFound();

  const drop = dropForProduct(product.id);
  const brandSlug =
    product.brandSlug ||
    product.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  return (
    <div className="page-shell section-space">
      <Track name="product_view" productId={product.id} brandSlug={brandSlug} />
      <Link href="/discover" className="mb-8 inline-flex items-center gap-2 text-xs" data-cursor="BACK">
        <ArrowLeft size={14} /> Back to discover
      </Link>

      <div className="grid gap-10 md:grid-cols-[1.05fr_.95fr]">
        <div
          className="aspect-[4/5] overflow-hidden bg-[color:var(--surface)]"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <p className="eyebrow">
              <Link href={`/brands/${brandSlug}`}>{product.label}</Link>
            </p>
            <h1 className="mt-3 text-[clamp(44px,6vw,82px)] font-semibold leading-[.88] tracking-[-.07em]">
              {product.name}
            </h1>
            <p className="mt-5 text-2xl">£{product.price}</p>
            <p className="mt-6 max-w-xl text-sm leading-7 text-[color:var(--muted)]">{product.description}</p>
          </div>

          <div className="mt-12 border-t hairline pt-6">
            <div className="flex justify-between text-xs">
              <span>Retailer</span>
              <span>{product.retailer}</span>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span>Niche</span>
              <Link href={`/discover?style=${encodeURIComponent(product.style)}`}>{product.style}</Link>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span>Category</span>
              <span>{product.category}</span>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span>Stock</span>
              <span>{product.stock ?? "—"} units</span>
            </div>
            <ProductActions product={product} brandSlug={brandSlug} dropId={drop?.id ?? null} />
          </div>
        </div>
      </div>
    </div>
  );
}
