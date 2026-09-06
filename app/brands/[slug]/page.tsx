import Link from "next/link";
import { notFound } from "next/navigation";
import { getLiveCatalogue } from "@/lib/catalogue";
import { ProductCard } from "@/components/product-card";
import { ReportButton } from "@/components/report-button";
import { FramedImage } from "@/components/image-frame";
import { objectPosition } from "@/lib/appearance";

export const dynamic = "force-dynamic";

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { brands, products } = await getLiveCatalogue();
  const brand = brands.find((item) => item.slug === slug);
  if (!brand) notFound();
  const pieces = products.filter((product) => product.brandSlug === brand.slug || product.label === brand.name);
  const bannerImage = brand.bannerMode === "image" && (brand.bannerUrl || brand.image);
  const bannerColor = brand.bannerColor || "#141414";

  return (
    <div className="page-shell">
      <section className="overflow-hidden border-b hairline">
        <div className="relative aspect-[16/6] bg-[color:var(--surface)]" style={{ background: bannerImage ? undefined : bannerColor }}>
          {bannerImage ? (
            <img
              src={bannerImage}
              alt=""
              className="h-full w-full object-cover"
              style={{ objectPosition: objectPosition(brand.bannerX, brand.bannerY) }}
            />
          ) : null}
        </div>
        <div className="py-10 md:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <FramedImage
              src={brand.avatarUrl}
              x={brand.avatarX}
              y={brand.avatarY}
              shape="circle"
              className="-mt-16 h-24 w-24 border hairline bg-[color:var(--bg)] sm:h-28 sm:w-28"
            />
            <div>
              <p className="eyebrow mb-3">Brand</p>
              <h1 className="text-[clamp(40px,7vw,84px)] font-semibold leading-[.86] tracking-[-.07em]">{brand.name}</h1>
              <p className="mt-3 text-sm text-[color:var(--muted)]">
                {[brand.niche, brand.location].filter(Boolean).join(" / ")}
              </p>
            </div>
          </div>
          {brand.description && (
            <p className="mt-6 max-w-xl text-sm leading-6 text-[color:var(--muted)]">{brand.description}</p>
          )}
          <div className="mt-6">
            <ReportButton targetType="brand" targetId={brand.slug} />
          </div>
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
