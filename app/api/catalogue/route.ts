import { NextResponse } from "next/server";
import { getLiveCatalogue } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export async function GET() {
  const catalogue = await getLiveCatalogue();
  return NextResponse.json(catalogue);
}
