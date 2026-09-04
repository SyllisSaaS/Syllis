import Link from "next/link";
import { LEGAL_CONTACT, LEGAL_EFFECTIVE, LEGAL_OPERATOR } from "@/lib/legal";

export default function TermsPage() {
  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="text-5xl font-semibold tracking-[-.06em]">Terms of use.</h1>
      <p className="mt-4 text-xs text-[color:var(--muted)]">Effective {LEGAL_EFFECTIVE}</p>

      <div className="mt-10 max-w-2xl space-y-8 text-sm leading-6 text-[color:var(--muted)]">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">The service</h2>
          <p>
            {LEGAL_OPERATOR} is a discovery platform. We list independent fashion, drops, and related
            tools. We are not the seller of products shown unless we say so. Purchases and fulfilment
            happen with the brand or retailer. Early reservations hold a capped unit for 30 minutes
            and are not a completed order until the brand confirms. You can release a hold at any
            time from Saved or Drops.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">Accounts</h2>
          <p>
            You must be 16 or older, provide accurate details, and keep your login safe. Shopper
            accounts start free. Brand and stylist accounts require an application and our
            verification. We may refuse, suspend, or close an account if these terms are broken, a
            listing is reported, or we are required to by law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">Plans and founding offers</h2>
          <p>
            Shopper Early is £4/month after a 7-day trial unless a founding offer applies. Brand
            plans are billed monthly after trial or according to the founding-year ladder (month 1
            free, then stepped discounts for the rest of the first year, then full price). Founding
            offers are for the first year from the date recorded on the account. Cancel anytime;
            paid features end when the subscription ends. Payments are processed by Stripe.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">Stylists</h2>
          <p>
            Verified stylists may take paid work arranged through Syllis. Syllis keeps 5% of the
            recorded gross payment as a platform fee; the rest is due to the stylist. Payout timing
            depends on how we record and settle that work.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">Your content</h2>
          <p>
            Brands and stylists grant us a licence to host and display the materials they submit so
            we can operate the platform. You must have the rights to what you upload. No counterfeit,
            stolen, hateful, or illegal listings. Anyone can report content; we review reports in
            admin and may remove material.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">Liability</h2>
          <p>
            The platform is provided as available. We are not responsible for brand stock, quality,
            shipping, or styling outcomes. Nothing in these terms limits liability that cannot be
            limited under English law. These terms are governed by the laws of England and Wales.
          </p>
        </section>

        <p>
          Questions: {LEGAL_CONTACT}. Related:{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
