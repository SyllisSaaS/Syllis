import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { products } from "@/lib/data";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);

  if (!product) notFound();

  return (
    <div className="page-shell section-space">
      <Link href="/discover" className="mb-8 inline-flex items-center gap-2 text-xs" data-cursor="BACK">
        <ArrowLeft size={14} /> Back to discover
      </Link>

      <div className="grid gap-10 md:grid-cols-[1.05fr_.95fr]">
        <div className="aspect-[4/5] overflow-hidden bg-[color:var(--surface)]">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <p className="eyebrow">{product.label}</p>
            <h1 className="mt-3 text-[clamp(44px,6vw,82px)] font-semibold leading-[.88] tracking-[-.07em]">{product.name}</h1>
            <p className="mt-5 text-2xl">£{product.price}</p>
            <p className="mt-6 max-w-xl text-sm leading-7 text-[color:var(--muted)]">{product.description}</p>
          </div>

          <div className="mt-12 border-t hairline pt-6">
            <div className="flex justify-between text-xs">
              <span>Retailer</span>
              <span>{product.retailer}</span>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span>Category</span>
              <span>{product.category}</span>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span>Demo stock</span>
              <span>{product.stock ?? "—"} units</span>
            </div>
            <button type="button" className="button button-dark mt-8 w-full" data-cursor="SHOP">
              Visit retailer <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
