import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { isAnalyticsEventName } from "@/lib/analytics";
import { insertEvent } from "@/lib/store";
import { getLiveCatalogue } from "@/lib/catalogue";
import { drops } from "@/lib/drops";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (!isAnalyticsEventName(body.name)) {
    return new NextResponse(null, { status: 400 });
  }

  const user = await getAuthUser();
  const productId = typeof body.productId === "string" ? body.productId : null;
  const { products } = await getLiveCatalogue();
  const product = productId ? products.find((item) => item.id === productId) : null;
  const drop = productId ? drops.find((item) => item.productId === productId) : null;
  const brandSlug =
    (typeof body.brandSlug === "string" && body.brandSlug) ||
    drop?.brandSlug ||
    product?.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ||
    null;

  await insertEvent({
    name: body.name,
    path: typeof body.path === "string" ? body.path.slice(0, 200) : null,
    productId,
    brandSlug,
    userId: user?.id ?? null,
  });

  return new NextResponse(null, { status: 204 });
}
