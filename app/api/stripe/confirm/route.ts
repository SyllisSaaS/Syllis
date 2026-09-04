import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { applyPlanCheckoutSession } from "@/lib/stripe-fulfill";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Log in first." }, { status: 401 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });

  let sessionId = "";
  try {
    const body = (await request.json()) as { sessionId?: string };
    sessionId = String(body.sessionId ?? "");
  } catch {
    sessionId = "";
  }
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Missing checkout session." }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.userId && session.metadata.userId !== profile.id && profile.role !== "admin") {
    return NextResponse.json({ error: "This checkout belongs to another account." }, { status: 403 });
  }
  if (session.metadata?.kind === "ad") {
    return NextResponse.json({ ok: true, kind: "ad" });
  }

  const result = await applyPlanCheckoutSession(session);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, plan: result.plan });
}
