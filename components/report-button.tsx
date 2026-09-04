"use client";

import { useState } from "react";

const REASONS = [
  "Counterfeit or stolen work",
  "Harassment or abuse",
  "Misleading listing",
  "Spam",
  "Other",
];

export function ReportButton({
  targetType,
  targetId,
  label = "Report",
}: {
  targetType: "brand" | "user" | "product" | "stylist" | "drop";
  targetId: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason, details }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setMessage(payload.error || "Could not send report.");
      return;
    }
    setMessage("Report sent. Thank you.");
    setOpen(false);
    setDetails("");
  }

  return (
    <div>
      <button type="button" className="text-xs underline underline-offset-4" onClick={() => setOpen((v) => !v)}>
        {label}
      </button>
      {message && <p className="mt-2 text-xs text-[color:var(--muted)]">{message}</p>}
      {open && (
        <form onSubmit={submit} className="panel mt-3 grid gap-3 border hairline p-4">
          <label className="grid gap-2 text-xs">
            Reason
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="border hairline bg-transparent px-3 py-2"
            >
              {REASONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-xs">
            Details
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-20 border hairline bg-transparent px-3 py-2"
              placeholder="What should we look at?"
            />
          </label>
          <button type="submit" disabled={busy} className="button button-dark !min-h-9 text-xs">
            {busy ? "Sending..." : "Submit report"}
          </button>
        </form>
      )}
    </div>
  );
}
