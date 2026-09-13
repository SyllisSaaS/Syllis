import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { siteUrl } from "@/lib/env";
import { getSetting, setSetting, trackingProviderKeys } from "@/lib/settings";
import { aftershipKeyWorks } from "@/lib/tracking-lookup";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const keys = await trackingProviderKeys();
  return NextResponse.json({
    aftership: Boolean(keys.aftership),
    easypost: Boolean(keys.easypost),
    webhookUrl: `${siteUrl().replace(/\/$/, "")}/api/tracking/webhook`,
    fromEnv: {
      aftership: Boolean((process.env.AFTERSHIP_API_KEY || "").trim()),
      easypost: Boolean((process.env.EASYPOST_API_KEY || "").trim()),
    },
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as {
    aftershipKey?: string;
    easypostKey?: string;
    action?: string;
  };

  if (body.action === "test") {
    const key = String(body.aftershipKey ?? (await getSetting("aftership_api_key"))).trim();
    if (!key) return NextResponse.json({ error: "Paste an Aftership key first." }, { status: 400 });
    const ok = await aftershipKeyWorks(key);
    return NextResponse.json(
      ok ? { ok: true, message: "Aftership accepted that key." } : { error: "Aftership rejected that key." },
      { status: ok ? 200 : 400 }
    );
  }

  try {
    if (typeof body.aftershipKey === "string" && body.aftershipKey.trim()) {
      const key = body.aftershipKey.trim();
      const ok = await aftershipKeyWorks(key);
      if (!ok) return NextResponse.json({ error: "Aftership rejected that key." }, { status: 400 });
      await setSetting("aftership_api_key", key);
    }
    if (typeof body.easypostKey === "string" && body.easypostKey.trim()) {
      await setSetting("easypost_api_key", body.easypostKey.trim());
    }
    return NextResponse.json({ ok: true, message: "Tracking key saved. New shipments will be watched automatically." });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not save." }, { status: 400 });
  }
}
