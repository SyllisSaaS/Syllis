import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { aggregateEvents } from "@/lib/analytics";
import { listEvents } from "@/lib/store";
import { profileEntitlements } from "@/lib/profile";
import { getLiveCatalogue } from "@/lib/catalogue";

export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }
  const access = profileEntitlements(profile);
  if (!access.entitlements.exportCsv) {
    return NextResponse.json({ error: "CSV export is on Premium." }, { status: 403 });
  }

  const from = new Date();
  from.setDate(from.getDate() - 90);
  const events = await listEvents({ brandSlug: profile.brand_slug, from, to: new Date() });
  const stats = aggregateEvents(events);
  const { products } = await getLiveCatalogue();
  const lines = [
    "metric,value",
    `views,${stats.views}`,
    `saves,${stats.saves}`,
    `clicks,${stats.clicks}`,
    `followers,${stats.followers}`,
    `drop_interest,${stats.dropInterest}`,
    `early_conversion_percent,${stats.earlyConversion}`,
    `save_rate_percent,${stats.saveRate}`,
    `ctr_percent,${stats.ctr}`,
    `reserve_rate_percent,${stats.reserveRate}`,
    `unique_users,${stats.uniqueUsers}`,
    "",
    "date,views,saves,clicks,reserves",
    ...stats.series.map(
      (row) => `${row.iso},${row.views},${row.saves},${row.clicks},${row.reserves}`
    ),
    "",
    "product,views",
    ...stats.topProducts.map((row) => {
      const name = products.find((product) => product.id === row.productId)?.name ?? row.productId;
      return `${name},${row.count}`;
    }),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="syllis-analytics.csv"`,
    },
  });
}
