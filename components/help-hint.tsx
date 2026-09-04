"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

const KEY = "syllis-help-dismissed";

export function HelpHint() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (pathname !== "/home") {
      setShow(false);
      return;
    }
    try {
      setShow(window.localStorage.getItem(KEY) !== "1");
    } catch {
      setShow(true);
    }
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="border-b hairline bg-[color:var(--surface)]">
      <div className="page-shell flex items-center justify-between gap-4 py-3 text-xs">
        <p>
          Lost in the features?{" "}
          <Link href="/help" className="underline underline-offset-4">
            A short guide for you
          </Link>
          . Skip it any time.
        </p>
        <button
          type="button"
          className="icon-button"
          aria-label="Dismiss help"
          onClick={() => {
            try {
              window.localStorage.setItem(KEY, "1");
            } catch {
              // ignore
            }
            setShow(false);
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
