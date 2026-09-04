import Link from "next/link";
import { ArrowUpRight, Megaphone } from "lucide-react";
import type { Ad, Brand, Product } from "@/lib/data";
import { resolveAdHref } from "@/lib/data";
import { adSurfaceLabel } from "@/lib/ads";

export function AdCard({
  ad,
  products = [],
  brands = [],
  compact = false,
}: {
  ad: Ad;
  products?: Product[];
  brands?: Brand[];
  compact?: boolean;
}) {
  const href = resolveAdHref(ad, products, brands);
  const nicheLabel = adSurfaceLabel(ad.placement);

  return (
    <Link
      href={href}
      className={`ad-card group relative block overflow-hidden bg-[color:var(--surface)] ${
        compact ? "min-h-[200px]" : "min-h-[320px]"
      }`}
      data-cursor="AD"
    >
      <img
        src={ad.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
      />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative flex h-full min-h-[inherit] flex-col justify-between p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="ad-badge inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] uppercase tracking-[.14em] text-black">
              <Megaphone size={11} />
              Sponsored
            </span>
            <span className="border border-white/35 px-2 py-1 font-mono text-[9px] uppercase tracking-[.14em] text-white/90">
              {nicheLabel}
            </span>
          </div>
          <ArrowUpRight size={15} />
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[.12em] text-white/70">{ad.brand}</p>
          <h3
            className={`${compact ? "text-xl" : "text-3xl"} mt-1 max-w-lg font-semibold leading-none tracking-[-.04em]`}
          >
            {ad.title}
          </h3>
          <p className="mt-3 text-[11px] uppercase tracking-[.12em] text-white/70">View the piece</p>
        </div>
      </div>
    </Link>
  );
}
