import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { getLiveCatalogue } from "@/lib/catalogue";
import { adsForPlacement } from "@/lib/data";
import { dropStatus, drops } from "@/lib/drops";
import { inventoryForDrop, listUserHolds } from "@/lib/store";
import { profileEntitlements } from "@/lib/profile";

export async function GET() {
  const profile = await getProfile();
  const early =
    profile &&
    profileEntitlements(profile).entitlements.earlyAccess &&
    profileEntitlements(profile).active;
  const { products, ads } = await getLiveCatalogue();
  const liveIds = new Set(products.map((product) => product.id));
  const visible = drops.filter((drop) => liveIds.has(drop.productId));
  const holds = profile ? await listUserHolds(profile.id) : [];
  const holdByDrop = new Map(holds.map((row) => [row.drop_id, row.expires_at]));

  const payload = await Promise.all(
    visible.map(async (drop) => {
      const status = dropStatus(drop);
      return {
        ...drop,
        productSlug: products.find((product) => product.id === drop.productId)?.slug ?? drop.productId,
        status,
        stock: await inventoryForDrop(drop.id),
        canSeeEarly: Boolean(early) || status !== "early",
        heldUntil: holdByDrop.get(drop.id) ?? null,
      };
    })
  );

  return NextResponse.json({
    early: Boolean(early),
    drops: payload,
    ads: adsForPlacement(ads, "Drop"),
  });
}
