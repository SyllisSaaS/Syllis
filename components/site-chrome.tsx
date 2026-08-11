import Link from "next/link";
import { Search, UserRound, Bookmark } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function SiteChrome() {
  return (
    <header className="sticky top-0 z-40 border-b hairline bg-[color:var(--bg)]/95 backdrop-blur">
      <div className="page-shell flex h-[68px] items-center justify-between gap-6">
        <Link href="/" className="text-xl font-extrabold tracking-[-.06em]" data-cursor="HOME">
          SYLLIS
        </Link>

        <nav className="hidden items-center gap-7 text-xs md:flex">
          <Link href="/discover" className="nav-link" data-cursor="DISCOVER">Discover</Link>
          <Link href="/collections" className="nav-link" data-cursor="COLLECTIONS">Collections</Link>
          <Link href="/brands" className="nav-link" data-cursor="BRANDS">Brands</Link>
          <Link href="/pricing" className="nav-link" data-cursor="PRICING">Pricing</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/search" className="icon-button" aria-label="Search" data-cursor="SEARCH">
            <Search size={15} />
          </Link>
          <Link href="/saved" className="icon-button hidden sm:inline-flex" aria-label="Saved" data-cursor="SAVED">
            <Bookmark size={15} />
          </Link>
          <Link href="/profile" className="icon-button hidden sm:inline-flex" aria-label="Profile" data-cursor="PROFILE">
            <UserRound size={15} />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
