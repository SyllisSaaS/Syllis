import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { adsForPlacement } from "@/lib/data";
import { getLiveCatalogue } from "@/lib/catalogue";
import { ReportButton } from "@/components/report-button";
import { AdCard } from "@/components/ad-card";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const { brands, ads, products } = await getLiveCatalogue();
  const brandAds = adsForPlacement(ads, "Brand");
  return (
    <div className="page-shell">
      <section className="border-b hairline py-14 md:py-20">
        <p className="eyebrow mb-4">Brands</p>
        <h1 className="text-[clamp(54px,8vw,108px)] font-semibold leading-[.85] tracking-[-.075em]">
          Know the labels.
        </h1>
      </section>

      <section className="section-space">
        {brandAds.length > 0 && (
          <div className="mb-12 grid gap-4 md:grid-cols-2">
            {brandAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} products={products} brands={brands} />
            ))}
          </div>
        )}
        {brands.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No labels listed yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {brands.map((brand) => (
              <article id={brand.slug} key={brand.id} className="scroll-mt-24">
                <Link href={`/brands/${brand.slug}`} className="block">
                  <div className="aspect-[4/5] overflow-hidden bg-[color:var(--surface)]">
                    <img src={brand.image} alt="" className="h-full w-full object-cover" />
                  </div>
                </Link>
                <div className="border-b hairline py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">
                        <Link href={`/brands/${brand.slug}`}>{brand.name}</Link>
                      </h2>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">
                        {brand.niche} / {brand.location}
                      </p>
                    </div>
                    <ArrowUpRight size={15} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">{brand.description}</p>
                  <Link
                    href={`/discover?style=${encodeURIComponent(brand.niche.split(" ")[0])}`}
                    className="mt-5 inline-block text-xs underline underline-offset-4"
                    data-cursor="OPEN"
                  >
                    Browse related finds
                  </Link>
                  <div className="mt-4">
                    <ReportButton targetType="brand" targetId={brand.slug} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
