import { Check, ArrowRight, Megaphone, Users, Store, Sparkles } from "lucide-react";
import Link from "next/link";
import { userPlans, brandPlans, adPricing, adRenewalPrice } from "@/lib/data";
import { CheckoutButton } from "@/components/checkout-button";

const allRenewals = [0, 1, 2, 3, 4].map((times) => ({
  times,
  price: adRenewalPrice(adPricing.all[3], times),
}));

export default function PricingPage() {
  return (
    <div className="page-shell">
      <section className="border-b hairline py-16 md:py-24">
        <p className="eyebrow mb-4">Syllis pricing</p>
        <h1 className="max-w-5xl text-[clamp(56px,9vw,126px)] font-semibold leading-[.84] tracking-[-.08em]">
          Discover first.
          <br />
          Build later.
        </h1>
        <p className="mt-8 max-w-xl text-sm leading-6 text-[color:var(--muted)]">
          Syllis has two sides: a simple membership for people discovering fashion, and separate seller plans for independent brands.
        </p>
      </section>

      <section className="section-space">
        <div className="mb-10">
          <p className="eyebrow mb-3">01 / For shoppers</p>
          <h2 className="text-4xl font-semibold tracking-[-.055em] md:text-5xl">Choose your access.</h2>
          <p className="mt-3 max-w-xl text-sm text-[color:var(--muted)]">
            Start free. Upgrade only if early access and limited reservations are worth it to you.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {userPlans.map((plan) => (
            <article key={plan.id} className={`border p-7 md:p-9 ${plan.id === "early" ? "border-[color:var(--text)]" : "hairline"}`}>
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-2xl font-semibold">{plan.name}</p>
                  <p className="mt-2 max-w-md text-sm text-[color:var(--muted)]">{plan.description}</p>
                </div>
                {plan.id === "early" && <span className="eyebrow">Popular</span>}
              </div>

              <div className="mt-9 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-[-.06em]">£{plan.price}</span>
                {plan.price > 0 && <span className="pb-1 text-xs text-[color:var(--muted)]">/ month</span>}
              </div>

              <ul className="mt-8 space-y-3 border-t hairline pt-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm">
                    <Check size={15} className="mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.id === "free" ? (
                <Link href="/signup" className="button button-quiet mt-9 w-full" data-cursor="JOIN">
                  Create free account <ArrowRight size={15} />
                </Link>
              ) : (
                <CheckoutButton plan="early" className="button button-dark mt-9 w-full">
                  Start 7-day Early trial <ArrowRight size={15} />
                </CheckoutButton>
              )}
            </article>
          ))}
        </div>

        <div className="mt-8 border hairline bg-[color:var(--surface)] p-6">
          <p className="eyebrow mb-2">Reservation model</p>
          <p className="max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
            Early members do not get unlimited stock. Each upcoming drop can reserve only a capped portion of its inventory, leaving the majority available to everyone when the public window opens.
          </p>
        </div>
      </section>

      <section className="section-space border-t hairline">
        <div className="mb-10">
          <p className="eyebrow mb-3">02 / For brands</p>
          <h2 className="text-4xl font-semibold tracking-[-.055em] md:text-5xl">Seller plans.</h2>
          <p className="mt-3 max-w-xl text-sm text-[color:var(--muted)]">
            These are deliberately separate so shoppers see their own pricing first.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {brandPlans.map((plan) => (
            <article key={plan.id} className={`flex flex-col border p-7 ${plan.id === "growth" ? "border-[color:var(--text)]" : "hairline"}`}>
              <div className="flex-1">
                <p className="text-2xl font-semibold">{plan.name}</p>
                <p className="mt-2 text-sm text-[color:var(--muted)]">{plan.description}</p>

                <div className="mt-7">
                  <span className="text-4xl font-semibold tracking-[-.05em]">£{plan.price}</span>
                  <span className="ml-2 text-xs text-[color:var(--muted)]">/ month</span>
                </div>

                <p className="mt-4 text-xs text-[color:var(--muted)]">Up to {plan.products} live products</p>

                <ul className="mt-7 space-y-3 border-t hairline pt-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm">
                      <Check size={15} className="mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <CheckoutButton
                plan={plan.id}
                className={`button mt-9 w-full ${plan.id === "growth" ? "button-dark" : "button-quiet"}`}
              >
                Start 7-day {plan.name} trial <ArrowRight size={15} />
              </CheckoutButton>
            </article>
          ))}
        </div>
      </section>

      <section id="advertising" className="section-space border-t hairline">
        <div className="grid gap-12 md:grid-cols-[.65fr_1.35fr]">
          <div>
            <p className="eyebrow mb-3">03 / Advertising</p>
            <h2 className="text-4xl font-semibold tracking-[-.055em] md:text-5xl">Own a slot.</h2>
            <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
              Niches are cheaper because fewer people see them. All Syllis costs more because it sits on Home and Discover. Slots are capped so the feed stays readable.
            </p>
            <p className="mt-4 text-xs leading-5 text-[color:var(--muted)]">
              {adPricing.slots.all} All Syllis · {adPricing.slots.niche} per niche · {adPricing.slots.brand} brand · {adPricing.slots.drop} drop · each renew is 45% more, then the price locks after {adPricing.renewalCap} renewals.
            </p>
            <Link href="/studio" className="button button-dark mt-6 w-fit" data-cursor="OPEN">
              Book a slot in Studio <ArrowRight size={15} />
            </Link>
          </div>

          <div className="space-y-4">
            <div className="border hairline p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Megaphone size={18} />
                  <h3 className="text-lg font-semibold">All Syllis</h3>
                </div>
                <span className="text-[10px] uppercase tracking-[.12em] text-[color:var(--muted)]">
                  {adPricing.slots.all} slots
                </span>
              </div>
              <p className="mt-2 text-xs text-[color:var(--muted)]">Home featured row and Discover / All Syllis.</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="bg-[color:var(--surface)] p-4">
                  <p className="eyebrow">3 days</p>
                  <p className="mt-2 text-2xl font-semibold">£{adPricing.all[3]}</p>
                </div>
                <div className="bg-[color:var(--surface)] p-4">
                  <p className="eyebrow">7 days</p>
                  <p className="mt-2 text-2xl font-semibold">£{adPricing.all[7]}</p>
                </div>
              </div>
            </div>

            <div className="border hairline p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Users size={18} />
                  <h3 className="text-lg font-semibold">Niche</h3>
                </div>
                <span className="text-[10px] uppercase tracking-[.12em] text-[color:var(--muted)]">
                  {adPricing.slots.niche} slot each
                </span>
              </div>
              <p className="mt-2 text-xs text-[color:var(--muted)]">Only on that niche page — Washed, Techwear, and so on.</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="bg-[color:var(--surface)] p-4">
                  <p className="eyebrow">3 days</p>
                  <p className="mt-2 text-2xl font-semibold">£{adPricing.niche[3]}</p>
                </div>
                <div className="bg-[color:var(--surface)] p-4">
                  <p className="eyebrow">7 days</p>
                  <p className="mt-2 text-2xl font-semibold">£{adPricing.niche[7]}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="border hairline p-6">
                <div className="flex items-center gap-3">
                  <Store size={18} />
                  <h3 className="text-lg font-semibold">Brand slot</h3>
                </div>
                <p className="mt-2 text-xs text-[color:var(--muted)]">On Home labels and the Brands index.</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="bg-[color:var(--surface)] p-4">
                    <p className="eyebrow">3 days</p>
                    <p className="mt-2 text-2xl font-semibold">£{adPricing.brand[3]}</p>
                  </div>
                  <div className="bg-[color:var(--surface)] p-4">
                    <p className="eyebrow">7 days</p>
                    <p className="mt-2 text-2xl font-semibold">£{adPricing.brand[7]}</p>
                  </div>
                </div>
              </div>
              <div className="border hairline p-6">
                <div className="flex items-center gap-3">
                  <Sparkles size={18} />
                  <h3 className="text-lg font-semibold">Drop slot</h3>
                </div>
                <p className="mt-2 text-xs text-[color:var(--muted)]">Timed launch on Drops. Most expensive, shortest heat.</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="bg-[color:var(--surface)] p-4">
                    <p className="eyebrow">3 days</p>
                    <p className="mt-2 text-2xl font-semibold">£{adPricing.drop[3]}</p>
                  </div>
                  <div className="bg-[color:var(--surface)] p-4">
                    <p className="eyebrow">7 days</p>
                    <p className="mt-2 text-2xl font-semibold">£{adPricing.drop[7]}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border hairline p-6">
              <p className="text-sm font-semibold">Renewal ladder — All Syllis / 3 days</p>
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                Each renew is 45% more than the last. After {adPricing.renewalCap} renewals the price stays put.
              </p>
              <div className="mt-5 grid grid-cols-5 gap-2">
                {allRenewals.map((row) => (
                  <div key={row.times} className="bg-[color:var(--surface)] p-3">
                    <p className="eyebrow">{row.times === 0 ? "First" : `Renew ${row.times}`}</p>
                    <p className="mt-2 text-lg font-semibold">£{row.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y hairline py-14">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="eyebrow">Ready to test the seller side?</p>
            <p className="mt-2 text-xl font-semibold">Create a brand account, then start a trial.</p>
          </div>
          <Link href="/signup?role=brand" className="button button-dark" data-cursor="JOIN">
            Create brand account <Store size={15} />
          </Link>
        </div>
      </section>

      <section className="section-space border-t hairline">
        <p className="eyebrow mb-3">04 / Founding year</p>
        <h2 className="text-4xl font-semibold tracking-[-.055em] md:text-5xl">Early brands, one year in.</h2>
        <p className="mt-3 max-w-xl text-sm text-[color:var(--muted)]">
          Founding brands and early-access shoppers get a stepped first year, then full price.
        </p>
        <div className="mt-8 grid gap-3 md:grid-cols-5">
          {[
            ["Month 1", "Free"],
            ["Months 2–3", "90% off"],
            ["Months 4–6", "75% off"],
            ["Months 7–9", "50% off"],
            ["Months 10–12", "25% off"],
          ].map(([when, off]) => (
            <div key={when} className="panel border hairline p-5">
              <p className="text-xs text-[color:var(--muted)]">{when}</p>
              <p className="mt-2 text-xl font-semibold">{off}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
