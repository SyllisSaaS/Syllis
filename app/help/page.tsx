import Link from "next/link";
import { getProfile } from "@/lib/auth";
import type { AccountRole } from "@/lib/plans";

type HelpRole = AccountRole | "guest";

function ShopperGuide({ asYou }: { asYou: boolean }) {
  return (
    <section id="you" className="scroll-mt-24">
      <p className="eyebrow mb-3">{asYou ? "You" : "Members"}</p>
      <h2 className="text-3xl font-semibold tracking-[-.04em]">
        {asYou ? "Find, save, hold." : "What members see."}
      </h2>
      <ul className="mt-6 max-w-2xl space-y-3 text-sm leading-6 text-[color:var(--muted)]">
        <li>
          <Link href="/discover" className="underline underline-offset-4">
            Discover
          </Link>{" "}
          is where the pieces live. <strong className="text-[color:var(--text)]">All Syllis</strong>{" "}
          is every niche together. Pick <strong className="text-[color:var(--text)]">Washed</strong>,{" "}
          <strong className="text-[color:var(--text)]">Techwear</strong> and the rest to stay in one
          lane.
        </li>
        <li>
          Yellow <strong className="text-[color:var(--text)]">Sponsored</strong> cards are ads. Tap
          one and you go to that piece.
        </li>
        <li>
          Heart something and it stays in{" "}
          <Link href="/saved" className="underline underline-offset-4">
            Saved
          </Link>
          .
        </li>
        <li>
          <Link href="/drops" className="underline underline-offset-4">
            Drops
          </Link>{" "}
          can be reserved for 30 minutes. That hold sits in{" "}
          <Link href="/saved#reserved" className="underline underline-offset-4">
            Saved → Reserved
          </Link>
          . Drop it anytime from there. A hold is not a purchase — you still check out with the
          brand.
        </li>
        <li>
          Free is enough to browse. Early (£4/month) lets you into early drop windows and the
          capped early pool. Plans are on{" "}
          <Link href="/pricing" className="underline underline-offset-4">
            Pricing
          </Link>
          .
        </li>
      </ul>
    </section>
  );
}

function BrandGuide({ forYou }: { forYou: boolean }) {
  return (
    <section id="brand" className="scroll-mt-24">
      <p className="eyebrow mb-3">{forYou ? "Your label" : "For labels"}</p>
      <h2 className="text-3xl font-semibold tracking-[-.04em]">
        {forYou ? "Studio is yours." : "List with Syllis."}
      </h2>
      <ul className="mt-6 max-w-2xl space-y-3 text-sm leading-6 text-[color:var(--muted)]">
        {forYou ? (
          <>
            <li>
              <Link href="/studio" className="underline underline-offset-4">
                Studio
              </Link>{" "}
              is your desk: plan, analytics, and what your pieces are doing on Syllis.
            </li>
            <li>
              Starter is a written summary. Growth adds simple charts. Premium is the full
              dashboard. Change plans from Studio or Pricing.
            </li>
            <li>
              Your catalogue is set up with Syllis for now. You cannot add pieces yourself yet —
              once you are verified, we list them for you.
            </li>
            <li>
              Ads you buy can sit on All Syllis, a niche, a brand slot (labels pages), or a drop
              slot. All is dearer because more people see it. Niche ads only show in that niche.
              Book and pay from Studio — each time you renew the same surface, the price goes up
              45% for four steps, then it holds.
            </li>
            <li>
              Your own shop checkout stays on your site. You never paste your shop’s Stripe keys
              into Syllis. Studio analytics are views, saves and clicks here — not your website’s
              takings.
            </li>
          </>
        ) : (
          <>
            <li>
              Run a label?{" "}
              <Link href="/signup?role=brand" className="underline underline-offset-4">
                Apply as a brand
              </Link>
              . After you are verified, Studio is where you see how people find you and where you
              book ad slots.
            </li>
            <li>
              Seller plans and ad slots are on{" "}
              <Link href="/pricing" className="underline underline-offset-4">
                Pricing
              </Link>
              . Pay from Studio or Pricing once you have an account.
            </li>
          </>
        )}
      </ul>
    </section>
  );
}

function StylistGuide({ forYou }: { forYou: boolean }) {
  return (
    <section id="stylist" className="scroll-mt-24">
      <p className="eyebrow mb-3">{forYou ? "Your work" : "For stylists"}</p>
      <h2 className="text-3xl font-semibold tracking-[-.04em]">
        {forYou ? "You are in review, or ready to work." : "Style through Syllis."}
      </h2>
      <ul className="mt-6 max-w-2xl space-y-3 text-sm leading-6 text-[color:var(--muted)]">
        {forYou ? (
          <>
            <li>
              Apply with a portfolio. Until you are verified, paid work stays locked. You can still
              browse the public site.
            </li>
            <li>
              When a booking is recorded through Syllis, you keep 95%. Syllis keeps 5%.
            </li>
            <li>
              Public profiles, reviews, and promoting yourself on the home feed are not open yet.
            </li>
          </>
        ) : (
          <>
            <li>
              Style for a living?{" "}
              <Link href="/signup?role=stylist" className="underline underline-offset-4">
                Apply as a stylist
              </Link>
              . After review, paid work can run through Syllis. Syllis keeps 5%.
            </li>
            <li>Profiles, reviews and homepage promo are not open yet.</li>
          </>
        )}
      </ul>
    </section>
  );
}

function OperatorGuide() {
  return (
    <section id="admin" className="scroll-mt-24">
      <p className="eyebrow mb-3">Operator</p>
      <h2 className="text-3xl font-semibold tracking-[-.04em]">Only you see this.</h2>
      <ul className="mt-6 max-w-2xl space-y-3 text-sm leading-6 text-[color:var(--muted)]">
        <li>
          <Link href="/admin" className="underline underline-offset-4">
            Admin
          </Link>{" "}
          is your desk: Overview, Payments, Catalogue, People, Applications, Reports, Stylists,
          Test lab. Members never get this section or the shield in the header.
        </li>
        <li>
          Overview charts: pick a date range and hide those events if you were testing. Restore the
          batch if that was a mistake. Income and accounts are not touched.
        </li>
        <li>
          Catalogue: load the small demo pack to try the public site, then hide or delete it. Do
          not mass-seed fakes.
        </li>
        <li>People: verify, set plans, Remove (never your own admin account).</li>
        <li>
          Test lab creates a throwaway brand. Log in with it in a private window. Remove it from
          People when you are done.
        </li>
        <li>
          Payments is where you coordinate Stripe: keys status, create the four monthly products
          (Early, Starter, Growth, Premium), comp a test ad, and see bookings plus ledger. Paste
          `supabase/payments.sql` if that tab errors. Point a webhook at `/api/stripe/webhook` for
          `checkout.session.completed`, `customer.subscription.*`, and `invoice.paid`. Use Stripe
          CLI locally (`stripe listen --forward-to localhost:3000/api/stripe/webhook`). Keep
          `SUPABASE_SERVICE_ROLE_KEY` set so the webhook can write ads. Do not turn on Stripe Tax
          until you have a registration. Enable Customer Portal in the Dashboard so members can
          manage billing. Set 16+ in Stripe Radar or your terms — Checkout has no native age gate.
        </li>
        <li>
          Your Stripe keys go in `.env.local` (`STRIPE_SECRET_KEY` or a restricted key). You can
          skip pasting four price IDs if you create products from Payments. Syllis calculates ad
          renewals and founding discounts; Stripe just charges that amount. Admin Overview is{" "}
          <em>your</em> income, not a brand’s own shop.
        </li>
        <li>
          Never ask a brand for their secret Stripe key. Connect is later, if they sell through
          you.
        </li>
      </ul>
    </section>
  );
}

export default async function HelpPage() {
  const profile = await getProfile();
  const role: HelpRole = profile?.role ?? "guest";
  const shopper = role === "guest" || role === "shopper";
  const brand = role === "brand";
  const stylist = role === "stylist";
  const admin = role === "admin";

  const intro =
    role === "brand"
      ? "This is for your label — how Studio, ads and the public site work for you."
      : role === "stylist"
        ? "This is for your styling work, plus how to use the public site."
        : role === "admin"
          ? "You are signed in as operator. Members never see the operator section."
          : "A short map of Syllis. Skip it whenever you want.";

  const nav = [
    { href: "#you", label: shopper || admin ? "You" : "Using Syllis", show: true },
    { href: "#brand", label: brand ? "Your label" : "For labels", show: shopper || brand || admin },
    { href: "#stylist", label: stylist ? "Your work" : "For stylists", show: shopper || stylist || admin },
    { href: "#admin", label: "Operator", show: admin },
  ].filter((item) => item.show);

  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-4">Guide</p>
      <h1 className="max-w-4xl text-[clamp(48px,8vw,96px)] font-semibold leading-[.86] tracking-[-.07em]">
        How Syllis works for you.
      </h1>
      <p className="mt-6 max-w-xl text-sm leading-6 text-[color:var(--muted)]">{intro}</p>

      <nav className="mt-10 flex flex-wrap gap-2">
        {nav.map((item) => (
          <a key={item.href} href={item.href} className="border hairline px-3 py-2 text-[11px]" data-cursor="OPEN">
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mt-14 space-y-14">
        {(shopper || brand || stylist || admin) && <ShopperGuide asYou={!admin} />}
        {(shopper || brand || admin) && <BrandGuide forYou={brand} />}
        {(shopper || stylist || admin) && <StylistGuide forYou={stylist} />}
        {admin && <OperatorGuide />}
      </div>
    </div>
  );
}
