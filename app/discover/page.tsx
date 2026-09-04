import { Suspense } from "react";
import { getLiveCatalogue } from "@/lib/catalogue";
import DiscoverContent from "./discover-content";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const { products, ads, brands } = await getLiveCatalogue();
  return (
    <Suspense
      fallback={
        <div className="page-shell">
          <section className="border-b hairline py-14 md:py-20">
            <p className="eyebrow mb-4">Discover</p>
            <h1 className="text-[clamp(50px,8vw,108px)] font-semibold leading-[.85] tracking-[-.075em]">
              Everything
              <br />
              worth finding.
            </h1>
          </section>
        </div>
      }
    >
      <DiscoverContent products={products} ads={ads} brands={brands} />
    </Suspense>
  );
}
