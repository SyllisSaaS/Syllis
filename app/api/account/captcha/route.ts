import { NextResponse } from "next/server";
import { issueCaptcha, verifyCaptcha } from "@/lib/captcha";

export function GET() {
  return NextResponse.json(issueCaptcha());
}

export async function POST(request: Request) {
  const body = (await request.json()) as { token?: string; answer?: string };
  if (!verifyCaptcha(body.token, body.answer)) {
    return NextResponse.json({ error: "Try the check again." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
