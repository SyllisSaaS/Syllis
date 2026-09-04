import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { getLiveCatalogue } from "@/lib/catalogue";
import { dropStatus, drops, getDrop } from "@/lib/drops";
import { createReservation, insertEvent, inventoryForDrop, listUserHolds, releaseHold, userHasHold } from "@/lib/store";
import { profileEntitlements } from "@/lib/profile";

export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ holds: [] });
  }

  const rows = await listUserHolds(profile.id);
  const { products } = await getLiveCatalogue();

  const holds = rows
    .map((row) => {
      const drop = drops.find((item) => item.id === row.drop_id);
      if (!drop) return null;
      const product = products.find((item) => item.id === drop.productId);
      return {
        id: row.id,
        dropId: drop.id,
        productId: drop.productId,
        productSlug: product?.slug ?? drop.productId,
        name: product?.name ?? drop.name,
        label: product?.label ?? drop.label,
        image: product?.image ?? drop.image,
        pool: row.pool,
        size: row.size,
        expiresAt: row.expires_at,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  return NextResponse.json({ holds });
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Log in to reserve a piece." }, { status: 401 });
  }

  const access = profileEntitlements(profile);
  let body: { dropId?: string; size?: string };
  try {
    body = (await request.json()) as { dropId?: string; size?: string };
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const drop = body.dropId ? getDrop(body.dropId) : null;
  if (!drop) {
    return NextResponse.json({ error: "Drop not found." }, { status: 404 });
  }

  const status = dropStatus(drop);
  if (status === "ended") {
    return NextResponse.json({ error: "This drop has ended." }, { status: 400 });
  }

  const nowEarly = status === "early";
  if (nowEarly && !(access.entitlements.canReserve && access.active)) {
    return NextResponse.json(
      { error: "Early reserves are for Early members during the early window." },
      { status: 403 }
    );
  }

  if (await userHasHold(drop.id, profile.id)) {
    return NextResponse.json({ error: "You already have a hold on this drop." }, { status: 409 });
  }

  try {
    const reservation = await createReservation({
      dropId: drop.id,
      userId: profile.id,
      email: profile.email,
      size: body.size ?? null,
      pool: nowEarly ? "early" : "public",
    });
    await insertEvent({
      name: "drop_reserve",
      path: `/drops/${drop.slug}`,
      productId: drop.productId,
      brandSlug: drop.brandSlug,
      userId: profile.id,
    });
    return NextResponse.json({ reservation, stock: await inventoryForDrop(drop.id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reserve.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }

  let body: { holdId?: string; dropId?: string };
  try {
    body = (await request.json()) as { holdId?: string; dropId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  try {
    const reservation = await releaseHold(profile.id, {
      holdId: body.holdId,
      dropId: body.dropId,
    });
    return NextResponse.json({ ok: true, reservation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not release hold.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
