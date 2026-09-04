import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { STYLIST_PLATFORM_CUT } from "@/lib/founding";

export default async function StylistsPage({
  searchParams,
}: {
  searchParams: Promise<{ applied?: string }>;
}) {
  const { applied } = await searchParams;

  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-4">Stylists</p>
      <h1 className="max-w-4xl text-[clamp(48px,8vw,104px)] font-semibold leading-[.86] tracking-[-.07em]">
        Verified stylists.
      </h1>
      <p className="mt-6 max-w-xl text-sm leading-6 text-[color:var(--muted)]">
        Apply with a portfolio. After review, you can take paid styling work through Syllis.
        Syllis keeps {Math.round(STYLIST_PLATFORM_CUT * 100)}% of what you are paid; you keep the
        rest.
      </p>
      {applied === "1" && (
        <p className="mt-6 max-w-xl text-sm">
          Application received. Check your email if confirmation is required, then wait for verification.
        </p>
      )}
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="panel border hairline p-6">
          <p className="eyebrow">Apply</p>
          <p className="mt-4 text-sm text-[color:var(--muted)]">
            Instagram, portfolio and a short note. Applications sit in admin until verified.
          </p>
        </div>
        <div className="panel border hairline p-6">
          <p className="eyebrow">Cut</p>
          <p className="mt-4 text-3xl font-semibold">{Math.round(STYLIST_PLATFORM_CUT * 100)}%</p>
          <p className="mt-2 text-xs text-[color:var(--muted)]">Platform share, recorded in the ledger</p>
        </div>
        <div className="panel border hairline p-6">
          <p className="eyebrow">Payouts</p>
          <p className="mt-4 text-sm text-[color:var(--muted)]">
            Admins record gross payments. Net goes to you; the cut is Syllis income.
          </p>
        </div>
      </div>
      <Link href="/signup?role=stylist" className="button button-dark mt-10">
        Apply as a stylist <ArrowRight size={15} />
      </Link>
    </div>
  );
}
