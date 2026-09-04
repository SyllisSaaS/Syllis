import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { STYLIST_PLATFORM_CUT } from "@/lib/founding";
import { T } from "@/lib/tables";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = (await request.json()) as { stylistId?: string; grossPence?: number; note?: string };
  if (!body.stylistId || !body.grossPence || body.grossPence <= 0) {
    return NextResponse.json({ error: "stylistId and grossPence required." }, { status: 400 });
  }

  const cut = Math.round(body.grossPence * STYLIST_PLATFORM_CUT);
  const net = body.grossPence - cut;
  const supabase = createServiceClient() ?? (await createClient());
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const { error } = await supabase.from(T.payouts).insert({
    stylist_id: body.stylistId,
    gross_pence: body.grossPence,
    platform_cut_pence: cut,
    net_pence: net,
    note: body.note ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from(T.ledger).insert({
    source: "stylist_cut",
    amount_pence: cut,
    currency: "gbp",
    description: "5% stylist platform cut",
    user_id: body.stylistId,
  });

  return NextResponse.json({ cut, net, gross: body.grossPence });
}
