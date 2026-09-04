import Link from "next/link";
import { notFound } from "next/navigation";
import { getLiveCatalogue } from "@/lib/catalogue";
import { ProductCard } from "@/components/product-card";
import { ReportButton } from "@/components/report-button";

export const dynamic = "force-dynamic";

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { brands, products } = await getLiveCatalogue();
  const brand = brands.find((item) => item.slug === slug);
  if (!brand) notFound();
  const pieces = products.filter((product) => product.brandSlug === brand.slug || product.label === brand.name);

  return (
    <div className="page-shell">
      <section className="border-b hairline py-14 md:py-20">
        <p className="eyebrow mb-4">Brand</p>
        <h1 className="text-[clamp(48px,8vw,96px)] font-semibold leading-[.86] tracking-[-.07em]">{brand.name}</h1>
        <p className="mt-4 text-sm text-[color:var(--muted)]">
          {brand.niche} / {brand.location}
        </p>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[color:var(--muted)]">{brand.description}</p>
        <div className="mt-6">
          <ReportButton targetType="brand" targetId={brand.slug} />
        </div>
      </section>
      <section className="section-space">
        {pieces.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No live pieces for this label yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">
            {pieces.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        <Link href="/brands" className="mt-10 inline-block text-xs underline underline-offset-4">
          All brands
        </Link>
      </section>
    </div>
  );
}
