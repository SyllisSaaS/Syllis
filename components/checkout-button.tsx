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
  const [note, setNote] = useState("");

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => setNote("Billing is paused. No money will be taken. The plan is already active on the account.")}
        className={className}
        data-cursor="PLAN"
      >
        {children}
      </button>
      {note && <p className="text-xs text-[color:var(--muted)]">{note}</p>}
      <p className="sr-only">{plan}</p>
    </div>
  );
}

export function PortalButton({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled
        className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}
        data-cursor="BILLING"
      >
        {children}
      </button>
      <p className="text-xs text-[color:var(--muted)]">Billing is paused. Nothing will be charged.</p>
    </div>
  );
}
