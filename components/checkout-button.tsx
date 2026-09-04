"use client";

import { useState } from "react";
import type { PlanId } from "@/lib/plans";

export function CheckoutButton({
  plan,
  children,
  className,
}: {
  plan: PlanId;
  children: React.ReactNode;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const payload = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !payload.url) {
      setError(payload.error || "Checkout is not available yet.");
      setLoading(false);
      return;
    }
    window.location.href = payload.url;
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className={className}
        data-cursor="CHECKOUT"
      >
        {loading ? "Redirecting..." : children}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function PortalButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/stripe/portal", { method: "POST" });
    const payload = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !payload.url) {
      setError(payload.error || "Billing portal is not available yet.");
      setLoading(false);
      return;
    }
    window.location.href = payload.url;
  }

  return (
    <div className="grid gap-2">
      <button type="button" onClick={openPortal} disabled={loading} className={className} data-cursor="BILLING">
        {loading ? "Opening..." : children}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
