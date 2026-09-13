import { NextResponse } from "next/server";
import { syncPendingTracking } from "@/lib/orders-fulfill";

function authorized(request: Request) {
  const secret = (process.env.CRON_SECRET || "").trim();
  const auth = request.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;
  if (request.headers.get("x-vercel-cron") === "1") return true;
  return process.env.NODE_ENV !== "production" && !secret;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const checked = await syncPendingTracking();
  return NextResponse.json({ checked });
}
