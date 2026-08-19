import Link from "next/link";
import { ArrowUpRight, Megaphone } from "lucide-react";
import type { Ad } from "@/lib/data";

export function AdCard({ ad, compact = false }: { ad: Ad; compact?: boolean }) {
  return (
    <Link
      href="/pricing#advertising"
      className={`ad-card group relative block overflow-hidden bg-[color:var(--surface)] ${compact ? "min-h-[180px]" : "min-h-[300px]"}`}
      data-cursor="AD"
    >
      <img src={ad.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]" />
      <div className="absolute inset-0 bg-black/35" />

      <div className="relative flex h-full min-h-[inherit] flex-col justify-between p-5 text-white">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.14em]">
            <Megaphone size={12} />
            Sponsored
          </span>
          <ArrowUpRight size={15} />
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[.12em] text-white/60">{ad.brand}</p>
          <h3 className={`${compact ? "text-xl" : "text-3xl"} mt-1 max-w-lg font-semibold leading-none tracking-[-.04em]`}>
            {ad.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}
