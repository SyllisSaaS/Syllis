import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getLiveCatalogue } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const { collections } = await getLiveCatalogue();
  return (
    <div className="page-shell">
      <section className="border-b hairline py-14 md:py-20">
        <p className="eyebrow mb-4">Niches</p>
        <h1 className="text-[clamp(54px,8vw,108px)] font-semibold leading-[.85] tracking-[-.075em]">
          One feed per niche.
        </h1>
      </section>

      <section className="section-space grid gap-8 md:grid-cols-3">
        {collections.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">Collections appear once live pieces exist.</p>
        ) : (
          collections.map((collection) => (
            <Link key={collection.slug} href={`/collections/${collection.slug}`} className="group" data-cursor="OPEN">
              <div className="aspect-[4/5] overflow-hidden bg-[color:var(--surface)]">
                <img src={collection.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" />
              </div>
              <div className="flex justify-between gap-4 border-b hairline py-4">
                <div>
                  <h2 className="text-lg font-semibold">{collection.title}</h2>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">{collection.subtitle}</p>
                </div>
                <ArrowUpRight size={15} />
              </div>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
