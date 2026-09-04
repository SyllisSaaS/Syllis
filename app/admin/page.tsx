import { AdminConsole } from "@/components/admin-console";

export default function AdminPage() {
  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-4">Operator</p>
      <h1 className="text-[clamp(48px,8vw,96px)] font-semibold leading-[.86] tracking-[-.07em]">
        Admin.
      </h1>
      <p className="mt-4 max-w-xl text-sm text-[color:var(--muted)]">
        Income, people, applications, reports and stylist cuts. Overview is a full operator
        analytics suite — funnels, heatmaps, overlays, rates — and modules can still be hidden.
        Use Test lab for a brand login, then set Starter / Growth / Premium on People to see
        each analytics tier. Catalogue is where you hide demo listings, seed fake products by
        niche, and add real brands.
      </p>
      <div className="mt-12">
        <AdminConsole />
      </div>
    </div>
  );
}
