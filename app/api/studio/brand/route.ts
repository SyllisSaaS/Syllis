import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import {
  APPEARANCE_SQL_HINT,
  BANNER_COLORS,
  DEFAULT_BANNER,
  clampFocus,
  isBannerColor,
  isMissingColumn,
} from "@/lib/appearance";
import { canUseStudio, profileEntitlements } from "@/lib/profile";
import { ensureStudioBrand } from "@/lib/studio";
import { T } from "@/lib/tables";
import { createServiceClient } from "@/lib/supabase/service";

function canStudio(profile: NonNullable<Awaited<ReturnType<typeof getProfile>>>) {
  return canUseStudio(profile);
}

export async function GET() {
  const profile = await getProfile();
  if (!profile || !canStudio(profile)) return NextResponse.json({ error: "Brand accounts only." }, { status: 403 });
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Service role is required." }, { status: 503 });

  const ensured = await ensureStudioBrand(supabase, profile);
  if (!ensured.brand) return NextResponse.json({ error: ensured.error, needsSql: ensured.needsSql }, { status: 400 });

  const access = profileEntitlements(profile);
  return NextResponse.json({
    brand: ensured.brand,
    customBanner: access.entitlements.customBanner,
    colors: BANNER_COLORS,
    needsSql: ensured.needsSql,
  });
}

export async function PATCH(request: Request) {
  const profile = await getProfile();
  if (!profile || !canStudio(profile)) return NextResponse.json({ error: "Brand accounts only." }, { status: 403 });

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Service role is required." }, { status: 503 });

  const ensured = await ensureStudioBrand(supabase, profile);
  if (!ensured.brand) return NextResponse.json({ error: ensured.error, needsSql: ensured.needsSql }, { status: 400 });

  const access = profileEntitlements(profile);
  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if (typeof body.name === "string") patch.name = body.name.trim().slice(0, 80) || String(ensured.brand.name);
  if (typeof body.niche === "string") patch.niche = body.niche.trim().slice(0, 40);
  if (typeof body.location === "string") patch.location = body.location.trim().slice(0, 80);
  if (typeof body.description === "string") patch.description = body.description.trim().slice(0, 400);
  if (typeof body.avatar_url === "string" || body.avatar_url === null) patch.avatar_url = body.avatar_url;
  if (body.avatar_x != null) patch.avatar_x = clampFocus(body.avatar_x);
  if (body.avatar_y != null) patch.avatar_y = clampFocus(body.avatar_y);

  const wantImage = body.banner_mode === "image";
  if (wantImage && !access.entitlements.customBanner) {
    return NextResponse.json(
      { error: "Starter banners are plain colours. Upgrade to Growth for a photo banner." },
      { status: 403 }
    );
  }

  if (typeof body.banner_mode === "string") {
    patch.banner_mode = wantImage ? "image" : "color";
  }
  if (typeof body.banner_color === "string") {
    patch.banner_color = isBannerColor(body.banner_color) ? body.banner_color : DEFAULT_BANNER;
  }
  if (typeof body.banner_url === "string" || body.banner_url === null) {
    if (!access.entitlements.customBanner && body.banner_url) {
      return NextResponse.json({ error: "Starter cannot upload a banner photo." }, { status: 403 });
    }
    patch.banner_url = body.banner_url;
    if (body.banner_url) patch.image = body.banner_url;
  }
  if (body.banner_x != null) patch.banner_x = clampFocus(body.banner_x);
  if (body.banner_y != null) patch.banner_y = clampFocus(body.banner_y);

  if (patch.banner_mode === "color" && typeof patch.banner_color === "string") {
    patch.image = "";
  }

  const { error } = await supabase.from(T.brands).update(patch).eq("id", String(ensured.brand.id));
  if (error) {
    return NextResponse.json(
      { error: isMissingColumn(error) ? APPEARANCE_SQL_HINT : error.message, needsSql: isMissingColumn(error) },
      { status: 400 }
    );
  }

  if (typeof patch.name === "string") {
    await supabase.from(T.profiles).update({ full_name: patch.name, name: patch.name }).eq("id", profile.id);
  }

  const { data } = await supabase.from(T.brands).select("*").eq("id", String(ensured.brand.id)).maybeSingle();
  return NextResponse.json({ brand: data, customBanner: access.entitlements.customBanner, colors: BANNER_COLORS });
}
