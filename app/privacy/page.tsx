import Link from "next/link";
import { LEGAL_CONTACT, LEGAL_EFFECTIVE, LEGAL_OPERATOR } from "@/lib/legal";

export default function PrivacyPage() {
  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="text-5xl font-semibold tracking-[-.06em]">Privacy policy.</h1>
      <p className="mt-4 text-xs text-[color:var(--muted)]">Effective {LEGAL_EFFECTIVE}</p>

      <div className="mt-10 max-w-2xl space-y-8 text-sm leading-6 text-[color:var(--muted)]">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">Who we are</h2>
          <p>
            {LEGAL_OPERATOR} (“Syllis”, “we”, “us”) is a fashion discovery platform. This policy
            explains what we collect, why, and your rights. For questions: {LEGAL_CONTACT}.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">What we collect</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Account details you submit: name, email, password (hashed by our auth provider), role, brand or stylist application notes.</li>
            <li>Product saves, drop reservations, and profile preferences such as look and plan.</li>
            <li>Usage events used for brand analytics: product views, saves, outbound clicks. These are tied to a brand, not shown as a public shopper identity.</li>
            <li>Reports you send about listings or accounts, and admin review notes.</li>
            <li>Billing records from Stripe (we do not store full card numbers).</li>
            <li>Technical cookies needed to keep you signed in and remember your look.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">How we use it</h2>
          <p>
            To run your account, verify brands and stylists, process subscriptions, show analytics to
            verified labels, handle reports, improve the product, and meet legal duties. We do not
            sell personal data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">Processors</h2>
          <p>
            Authentication and database hosting are provided by Supabase. Payments are handled by
            Stripe. They act on our instructions and have their own privacy terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">Legal basis and retention</h2>
          <p>
            We process account and billing data to perform the contract you accept at signup, and
            limited analytics as a legitimate interest in running a marketplace. We keep account data
            while the account is open and for a reasonable period afterwards if we must (for example
            invoices or dispute records).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">Your rights</h2>
          <p>
            Depending on where you live, you may ask for access, correction, deletion, restriction,
            or a copy of your data, and you may object to some processing. Email {LEGAL_CONTACT}. You
            can also close your account from settings once that flow is enabled, or by contacting us.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">Children</h2>
          <p>Syllis is not directed at children under 16. Do not create an account if you are under 16.</p>
        </section>

        <p>
          Related: <Link href="/terms" className="underline underline-offset-4">Terms of use</Link>.
        </p>
      </div>
    </div>
  );
}
