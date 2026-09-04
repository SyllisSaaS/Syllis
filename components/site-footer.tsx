import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t hairline">
      <div className="page-shell flex flex-col justify-between gap-10 py-10 md:flex-row md:items-end">
        <div>
          <p className="text-2xl font-extrabold tracking-[-.06em]">SYLLIS</p>
          <p className="mt-3 max-w-xs text-xs leading-5 text-[color:var(--muted)]">
            Discover independent fashion, one good find at a time.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-xs">
          <Link href="/home">Home</Link>
          <Link href="/discover">Discover</Link>
          <Link href="/drops">Drops</Link>
          <Link href="/stylists">Stylists</Link>
          <Link href="/help">Help</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
