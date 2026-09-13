"use client";

import { useEffect, useState } from "react";

export function AdminTracking() {
  const [aftership, setAftership] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [key, setKey] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/tracking");
    const data = (await res.json()) as { aftership?: boolean; webhookUrl?: string; error?: string };
    setAftership(Boolean(data.aftership));
    setWebhookUrl(data.webhookUrl ?? "");
    if (data.error) setMessage(data.error);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/admin/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aftershipKey: key }),
    });
    const data = (await res.json()) as { error?: string; message?: string };
    setMessage(data.error || data.message || "Saved.");
    setBusy(false);
    if (res.ok) setKey("");
    await load();
  }

  async function test() {
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/admin/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test", aftershipKey: key }),
    });
    const data = (await res.json()) as { error?: string; message?: string };
    setMessage(data.error || data.message || "Done.");
    setBusy(false);
  }

  return (
    <div className="panel border hairline p-6">
      <p className="eyebrow">Order tracking</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-.03em]">Aftership turns payouts on.</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
        Skip EasyPost Nexus. Aftership is the key Syllis actually uses. Paste it here once. Brands add
        tracking in Studio. Aftership watches the courier. When the parcel is delivered, Syllis sends
        the brand share from the Stripe balance. You do not come back to wire this again.
      </p>
      <p className="mt-4 text-sm">Aftership: {aftership ? "connected" : "not connected"}</p>

      <ol className="mt-4 max-w-2xl list-decimal space-y-2 pl-5 text-xs leading-5 text-[color:var(--muted)]">
        <li>
          Create a free Aftership Tracking account at{" "}
          <a href="https://www.aftership.com/tracking" target="_blank" rel="noreferrer" className="underline underline-offset-4">
            aftership.com/tracking
          </a>
          . Not EasyPost. Not Nexus.
        </li>
        <li>
          Open{" "}
          <a
            href="https://admin.aftership.com/settings/api-keys"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            admin.aftership.com/settings/api-keys
          </a>{" "}
          → Create API key → copy it.
        </li>
        <li>Paste it below and save. Then add this webhook in Aftership → Notifications → Webhooks:</li>
      </ol>
      {webhookUrl && (
        <p className="mt-3 break-all border hairline p-3 font-mono text-xs">{webhookUrl}</p>
      )}

      <input
        className="mt-4 w-full border hairline bg-transparent px-3 py-3 text-sm"
        type="password"
        placeholder={aftership ? "Replace Aftership key" : "Aftership API key"}
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="button button-dark" disabled={busy || !key} onClick={() => void save()}>
          {busy ? "Checking..." : "Save Aftership key"}
        </button>
        <button type="button" className="button button-quiet" disabled={busy || !key} onClick={() => void test()}>
          Test key
        </button>
      </div>
      {message && <p className="mt-3 text-xs text-[color:var(--muted)]">{message}</p>}
      <p className="mt-4 text-xs leading-5 text-[color:var(--muted)]">
        Also paste supabase/tracking.sql if save says the settings table is missing.
      </p>
    </div>
  );
}