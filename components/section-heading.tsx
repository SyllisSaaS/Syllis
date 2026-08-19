import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SectionHeading({
  eyebrow,
  title,
  href,
}: {
  eyebrow: string;
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-9 flex items-end justify-between gap-6">
      <div>
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h2 className="text-4xl font-semibold tracking-[-.055em] md:text-5xl">{title}</h2>
      </div>

      {href && (
        <Link href={href} className="hidden items-center gap-1 text-xs md:flex" data-cursor="OPEN">
          View all <ArrowUpRight size={13} />
        </Link>
      )}
    </div>
  );
}
