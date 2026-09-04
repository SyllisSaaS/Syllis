"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bookmark, CircleHelp, Search, Shield, Store, UserRound } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { LookToggle } from "./look-toggle";
import { HelpHint } from "./help-hint";

export function SiteChrome() {
  const pathname = usePathname();
  const landing = pathname === "/";
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hasSession =
      typeof window !== "undefined" &&
      Object.keys(window.localStorage).some(
        (key) => key.startsWith("sb-") && key.includes("auth-token")
      );
    if (!hasSession) {
      setAdmin(false);
      return;
    }

    fetch("/api/account/bootstrap")
      .then((r) => r.json())
      .then((payload: { role?: string | null }) => {
        if (!cancelled) setAdmin(payload.role === "admin");
      })
      .catch(() => {
        if (!cancelled) setAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
    <header className="sticky top-0 z-40 border-b hairline bg-[color:var(--bg)]/90 backdrop-blur">
      <div className="page-shell flex h-[68px] items-center justify-between gap-6">
        <Link
          href={landing ? "/" : "/home"}
          className="text-xl font-extrabold tracking-[-.06em]"
          data-cursor="HOME"
        >
          SYLLIS
        </Link>

        {!landing && (
          <nav className="hidden items-center gap-7 text-xs md:flex">
            <Link href="/home" className="nav-link" data-cursor="HOME">
              Home
            </Link>
            <Link href="/discover" className="nav-link" data-cursor="DISCOVER">
              Discover
            </Link>
            <Link href="/drops" className="nav-link" data-cursor="DROPS">
              Drops
            </Link>
            <Link href="/collections" className="nav-link" data-cursor="COLLECTIONS">
              Collections
            </Link>
            <Link href="/brands" className="nav-link" data-cursor="BRANDS">
              Brands
            </Link>
            <Link href="/stylists" className="nav-link" data-cursor="STYLISTS">
              Stylists
            </Link>
            <Link href="/pricing" className="nav-link" data-cursor="PRICING">
              Pricing
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {landing ? (
            <>
              <Link href="/pricing" className="nav-link hidden text-xs md:inline" data-cursor="PRICING">
                Pricing
              </Link>
              <Link href="/login" className="nav-link hidden text-xs md:inline" data-cursor="LOGIN">
                Log in
              </Link>
              <Link href="/signup" className="button button-quiet !min-h-9 !px-3 text-xs" data-cursor="JOIN">
                Sign up
              </Link>
              <Link href="/home" className="button button-dark !min-h-9 !px-3 text-xs" data-cursor="ENTER">
                Enter
              </Link>
            </>
          ) : (
            <>
              {admin && (
                <Link href="/admin" className="icon-button" aria-label="Admin" data-cursor="ADMIN">
                  <Shield size={15} />
                </Link>
              )}
              <Link href="/help" className="icon-button" aria-label="Help" data-cursor="HELP">
                <CircleHelp size={15} />
              </Link>
              <Link href="/search" className="icon-button" aria-label="Search" data-cursor="SEARCH">
                <Search size={15} />
              </Link>
              <Link href="/saved" className="icon-button hidden sm:inline-flex" aria-label="Saved" data-cursor="SAVED">
                <Bookmark size={15} />
              </Link>
              <Link href="/studio" className="icon-button hidden sm:inline-flex" aria-label="Brand studio" data-cursor="STUDIO">
                <Store size={15} />
              </Link>
              <Link href="/profile" className="icon-button hidden sm:inline-flex" aria-label="Profile" data-cursor="PROFILE">
                <UserRound size={15} />
              </Link>
            </>
          )}
          <LookToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
    <HelpHint />
    </>
  );
}
