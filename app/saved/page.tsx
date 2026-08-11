import { products } from "@/lib/data";
import { ProductCard } from "@/components/product-card";

export default function SavedPage() {
  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-4">Saved</p>
      <h1 className="text-5xl font-semibold tracking-[-.06em]">Your finds.</h1>
      <p className="mt-4 text-sm text-[color:var(--muted)]">Demo state resets on refresh for now.</p>
      <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">
        {products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}
