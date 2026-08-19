import { notFound } from "next/navigation";
import { collections, products } from "@/lib/data";
import { ProductCard } from "@/components/product-card";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = collections.find((item) => item.slug === slug);

  if (!collection) notFound();

  const collectionProducts = collection.products
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is (typeof products)[number] => Boolean(product));

  return (
    <div className="page-shell">
      <section className="relative min-h-[520px] overflow-hidden">
        <img src={collection.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative flex min-h-[520px] flex-col justify-end p-7 text-white md:p-12">
          <p className="font-mono text-[10px] uppercase tracking-[.14em]">Syllis collection</p>
          <h1 className="mt-3 max-w-4xl text-[clamp(48px,8vw,110px)] font-semibold leading-[.86] tracking-[-.075em]">{collection.title}</h1>
          <p className="mt-4 text-sm text-white/75">{collection.subtitle}</p>
        </div>
      </section>

      <section className="section-space">
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5">
          {collectionProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>
    </div>
  );
}
