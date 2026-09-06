import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { APPEARANCE_SQL_HINT, MEDIA_BUCKET } from "@/lib/appearance";
import { profileEntitlements } from "@/lib/profile";
import { createServiceClient } from "@/lib/supabase/service";

const KINDS = new Set(["avatar", "banner", "product"]);
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Log in first." }, { status: 401 });

  const access = profileEntitlements(profile);
  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "avatar");

  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image." }, { status: 400 });
  if (!KINDS.has(kind)) return NextResponse.json({ error: "Unknown upload type." }, { status: 400 });
  if (kind === "banner" && !access.entitlements.customBanner && profile.role !== "admin") {
    return NextResponse.json(
      { error: "Starter banners are plain colours. Upgrade to Growth to upload a banner photo." },
      { status: 403 }
    );
  }
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "Keep images under 4MB." }, { status: 400 });

  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Use a JPG, PNG or WebP image." }, { status: 400 });

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "Uploads need the service role key." }, { status: 503 });

  await supabase.storage.createBucket(MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: 4194304,
    allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  }).then(() => undefined, () => undefined);

  const path = `${profile.id}/${kind}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await supabase.storage.from(MEDIA_BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (uploaded.error) {
    return NextResponse.json(
      { error: uploaded.error.message.includes("Bucket") ? APPEARANCE_SQL_HINT : uploaded.error.message },
      { status: 400 }
    );
  }

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
