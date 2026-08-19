import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { products, styles, collections, brands, ads } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { AdCard } from "@/components/ad-card";

export default function Home() {
  const trending = products.slice(0, 4);
  const latest = products.slice(4, 8);
  const featuredBrands = brands.filter((brand) => brand.featured);

  return (
    <div>
      <section className="page-shell border-b hairline">
        <div className="grid items-end gap-12 py-12 md:grid-cols-[1.2fr_.8fr] md:py-16">
          <div className="pb-4">
            <p className="eyebrow mb-6">Independent fashion / 2026</p>
            <h1 className="max-w-[900px] text-[clamp(64px,10.8vw,164px)] font-semibold leading-[.83] tracking-[-.085em]">
              Discover
              <br />
              what&apos;s next.
            </h1>
          </div>

          <div className="flex max-w-sm flex-col gap-8 md:justify-self-end">
            <p className="text-[16px] leading-7 text-[color:var(--muted)]">
              A visual space for finding independent pieces, emerging labels and styles worth knowing.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/discover" className="button button-dark w-fit" data-cursor="EXPLORE">
                Explore Syllis <ArrowRight size={15} />
              </Link>
              <Link href="/collections" className="button button-quiet w-fit" data-cursor="OPEN">
                Collections
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b hairline">
        <div className="page-shell flex items-center gap-6 overflow-x-auto py-5">
          <span className="eyebrow shrink-0">Explore</span>
          {styles.slice(0, 7).map((style) => (
            <Link
              key={style}
              href={`/discover?style=${encodeURIComponent(style)}`}
              className="shrink-0 text-[13px] text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
              data-cursor="FILTER"
            >
              {style}
            </Link>
          ))}
        </div>
      </section>

      <section className="page-shell section-space">
        <SectionHeading eyebrow="01 / Right now" title="Trending" href="/discover" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
          {trending.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="page-shell pb-12 md:pb-24">
        <Link
          href="/collections/washed-edit"
          className="group relative block min-h-[560px] overflow-hidden bg-[color:var(--surface)]"
          data-cursor="OPEN"
        >
          <img src={collections[0].image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]" />
          <div className="absolute inset-0 bg-black/25" />
          <div className="relative flex min-h-[560px] flex-col justify-end p-7 text-white md:p-12">
            <p className="font-mono text-[10px] uppercase tracking-[.14em]">The Syllis Edit / 01</p>
            <div className="mt-3 flex items-end justify-between gap-8">
              <h2 className="max-w-2xl text-[clamp(40px,7vw,92px)] font-semibold leading-[.88] tracking-[-.07em]">
                The Washed Edit
              </h2>
              <ArrowUpRight size={28} className="hidden md:block" />
            </div>
            <p className="mt-5 max-w-md text-sm text-white/75">{collections[0].subtitle}</p>
          </div>
        </Link>
      </section>

      <section className="page-shell section-space">
        <SectionHeading eyebrow="Sponsored / All" title="Featured right now" href="/pricing#advertising" />
        <div className="grid gap-4 md:grid-cols-3">
          {ads.map((ad) => <AdCard key={ad.id} ad={ad} />)}
        </div>
      </section>

      <section className="page-shell section-space border-t hairline">
        <SectionHeading eyebrow="02 / Fresh finds" title="Just in" href="/discover" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
          {latest.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="page-shell border-y hairline py-16 md:py-24">
        <div className="mb-10 flex items-end justify-between gap-8">
          <div>
            <p className="eyebrow mb-3">03 / Know the labels</p>
            <h2 className="text-4xl font-semibold tracking-[-.055em] md:text-5xl">Independent brands.</h2>
          </div>
          <Link href="/brands" className="hidden text-xs underline underline-offset-4 md:block">View all brands</Link>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {featuredBrands.map((brand) => (
            <Link key={brand.id} href={`/brands#${brand.slug}`} className="group" data-cursor="OPEN">
              <div className="aspect-[4/5] overflow-hidden bg-[color:var(--surface)]">
                <img src={brand.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" />
              </div>
              <div className="flex items-start justify-between gap-4 border-b hairline py-4">
                <div>
                  <p className="text-[14px] font-semibold">{brand.name}</p>
                  <p className="mt-1 text-[12px] text-[color:var(--muted)]">{brand.niche} / {brand.location}</p>
                </div>
                <ArrowUpRight size={15} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-shell section-space">
        <div className="grid gap-12 md:grid-cols-[.7fr_1.3fr]">
          <div>
            <p className="eyebrow mb-3">04 / How it works</p>
            <h2 className="max-w-sm text-4xl font-semibold leading-none tracking-[-.055em] md:text-5xl">
              Find something worth keeping.
            </h2>
          </div>

          <div className="divide-y hairline border-y">
            {[
              ["01", "Discover", "Browse independent brands, emerging designers and pieces that don't show up everywhere else."],
              ["02", "Save", "Keep the pieces and brands you actually like in one place so you can come back later."],
              ["03", "Shop", "When you find something you want, head directly to the independent brand behind it."],
            ].map(([number, title, body]) => (
              <div key={number} className="grid gap-5 py-8 md:grid-cols-[80px_1fr]">
                <span className="font-mono text-xs text-[color:var(--muted)]">{number}</span>
                <div>
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-[color:var(--muted)]">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell border-y hairline py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-[.65fr_1.35fr]">
          <div>
            <p className="eyebrow mb-3">05 / Find your lane</p>
            <h2 className="text-4xl font-semibold tracking-[-.055em]">Explore by style.</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
            {styles.map((style) => (
              <Link
                key={style}
                href={`/discover?style=${encodeURIComponent(style)}`}
                className="group flex items-center justify-between border-b hairline py-3 text-[13px]"
                data-cursor="FILTER"
              >
                <span>{style}</span>
                <ArrowUpRight size={13} className="opacity-40 transition group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell section-space">
        <SectionHeading eyebrow="06 / More to explore" title="Collections" href="/collections" />
        <div className="grid gap-4 md:grid-cols-3">
          {collections.map((collection) => (
            <Link key={collection.slug} href={`/collections/${collection.slug}`} className="group" data-cursor="OPEN">
              <div className="aspect-[4/5] overflow-hidden bg-[color:var(--surface)]">
                <img src={collection.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" />
              </div>
              <div className="flex justify-between gap-4 py-3">
                <div>
                  <p className="text-[14px] font-semibold">{collection.title}</p>
                  <p className="mt-1 text-[12px] text-[color:var(--muted)]">{collection.subtitle}</p>
                </div>
                <ArrowUpRight size={15} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[color:var(--text)] text-[color:var(--bg)]">
        <div className="page-shell py-20 md:py-28">
          <div className="grid gap-12 md:grid-cols-[1.2fr_.8fr]">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.14em] opacity-50">For independent brands</p>
              <h2 className="mt-6 max-w-4xl text-[clamp(48px,7vw,96px)] font-semibold leading-[.86] tracking-[-.07em]">
                Your brand deserves to be discovered.
              </h2>
            </div>
            <div className="flex flex-col justify-end gap-7">
              <p className="max-w-md text-sm leading-6 opacity-60">
                Join the early brand waitlist and get ready to launch when Syllis opens its seller side.
              </p>
              <Link href="/waitlist" className="button w-fit border-[color:var(--bg)]" data-cursor="JOIN">
                Join the brand waitlist <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell section-space">
        <div className="text-center">
          <p className="eyebrow">The independent fashion index</p>
          <h2 className="mx-auto mt-6 max-w-4xl text-[clamp(48px,8vw,110px)] font-semibold leading-[.86] tracking-[-.075em]">
            Find your next favourite.
          </h2>
          <div className="mt-10 flex justify-center gap-3">
            <Link href="/discover" className="button button-dark" data-cursor="EXPLORE">
              Start exploring <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t hairline">
        <div className="page-shell flex flex-col justify-between gap-10 py-10 md:flex-row md:items-end">
          <div>
            <p className="text-2xl font-extrabold tracking-[-.06em]">SYLLIS</p>
            <p className="mt-3 max-w-xs text-xs leading-5 text-[color:var(--muted)]">
              Discover independent fashion, one good find at a time.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-xs">
            <Link href="/discover">Discover</Link>
            <Link href="/collections">Collections</Link>
            <Link href="/brands">Brands</Link>
            <Link href="/pricing">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
