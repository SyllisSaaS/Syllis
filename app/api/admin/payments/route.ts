import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/env";
import { ensureStripeCatalog, getStripe, storedPriceMap } from "@/lib/stripe";
import { expireAndPromoteAds, fulfillAdBooking } from "@/lib/ads-fulfill";
import { isAdDays, isAdPlacement } from "@/lib/ads";
import { T } from "@/lib/tables";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function db() {
  return createServiceClient() ?? (await createClient());
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const prices = await storedPriceMap();
  await expireAndPromoteAds();
  const supabase = await db();
  const { data: bookings } = supabase
    ? await supabase.from(T.adBookings).select("*").order("created_at", { ascending: false }).limit(40)
    : { data: [] };
  const { data: ledger } = supabase
    ? await supabase.from(T.ledger).select("*").order("occurred_at", { ascending: false }).limit(20)
    : { data: [] };

  return NextResponse.json({
    stripe: isStripeConfigured() && Boolean(getStripe()),
    webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    prices,
    bookings: bookings ?? [],
    ledger: ledger ?? [],
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  let body: {
    action?: string;
    placement?: string;
    days?: number;
    title?: string;
    brand?: string;
    image?: string;
    productSlug?: string;
    userId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (body.action === "ensure-catalog") {
    try {
      const catalog = await ensureStripeCatalog();
      return NextResponse.json({
        ok: true,
        catalog,
        message: "Syllis products and monthly prices are in Stripe. IDs are saved for checkout.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create products.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (body.action === "comp-ad") {
    const placement = body.placement ?? "";
    const days = Number(body.days);
    const title = String(body.title ?? "").trim();
    if (!isAdPlacement(placement) || !isAdDays(days) || !title) {
      return NextResponse.json({ error: "Placement, 3 or 7 days, and a title are required." }, { status: 400 });
    }
    const supabase = await db();
    if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const { data: booking, error } = await supabase
      .from(T.adBookings)
      .insert({
        user_id: body.userId || admin.id,
        placement,
        days,
        amount_pence: 0,
        renewals: 0,
        title,
        brand: String(body.brand ?? "Syllis"),
        image: String(body.image ?? ""),
        product_slug: body.productSlug ?? null,
        status: "pending",
      })
      .select("*")
      .single();
    if (error || !booking) {
      return NextResponse.json(
        { error: error?.message || "Paste supabase/payments.sql then retry." },
        { status: 400 }
      );
    }
    const result = await fulfillAdBooking({
      bookingId: booking.id,
      userId: booking.user_id,
      amountPence: 0,
    });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({
      ok: true,
      message: result.wait
        ? "Paid-comp recorded but the slot is full — it will not show until a slot frees."
        : "Comp slot is live. No Stripe charge.",
    });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
