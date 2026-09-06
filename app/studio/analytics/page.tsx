import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProfile } from "@/lib/auth";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export default async function StudioAnalyticsPage() {
  const profile = await getProfile();
  if (!profile || (profile.role !== "brand" && profile.role !== "admin")) {
    return (
      <div className="page-shell section-space">
        <p className="eyebrow mb-4">Analytics</p>
        <h1 className="text-4xl font-semibold">Brand accounts only.</h1>
        <Link href="/signup?role=brand" className="button button-dark mt-8">
          Create brand account
        </Link>
      </div>
    );
  }

  return (
    <div className="page-shell section-space">
      <Link href="/studio" className="mb-8 inline-flex items-center gap-2 text-xs">
        <ArrowLeft size={14} /> Studio
      </Link>
      <p className="eyebrow mb-4">Analytics</p>
      <h1 className="text-[clamp(44px,7vw,84px)] font-semibold leading-[.86] tracking-[-.07em]">
        What people actually did.
      </h1>
      <p className="mt-4 max-w-xl text-sm text-[color:var(--muted)]">
        These numbers come from real events. Starter is a written log, Growth is basic charts,
        Premium is the full suite. Nothing is invented.
      </p>
      <div className="mt-12">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}
