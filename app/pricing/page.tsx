"use client";

import { useState } from "react";
import { Check, ArrowRight, Megaphone, Users, Store } from "lucide-react";
import Link from "next/link";
import { userPlans, brandPlans, adPricing } from "@/lib/data";

export default function PricingPage() {
  const [renewal, setRenewal] = useState(false);

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

              <Link href="/signup" className={`button mt-9 w-full ${plan.id === "early" ? "button-dark" : "button-quiet"}`} data-cursor="JOIN">
                {plan.id === "free" ? "Create free account" : "Get Early"} <ArrowRight size={15} />
              </Link>
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

              <Link href="/waitlist" className={`button mt-9 w-full ${plan.id === "growth" ? "button-dark" : "button-quiet"}`} data-cursor="JOIN">
                Join brand waitlist <ArrowRight size={15} />
              </Link>
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
              Demo pricing for a future marketplace where brands can book short campaigns into specific discovery surfaces.
            </p>
          </div>

          <div className="space-y-4">
            <div className="border hairline p-6">
              <div className="flex items-center gap-3">
                <Megaphone size={18} />
                <h3 className="text-lg font-semibold">All Syllis</h3>
              </div>
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
              <div className="flex items-center gap-3">
                <Users size={18} />
                <h3 className="text-lg font-semibold">Niche placement</h3>
              </div>
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

            <div className="border hairline p-6">
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block text-sm font-semibold">Renewal simulation</span>
                  <span className="mt-1 block text-xs text-[color:var(--muted)]">Each renewal is 45% higher than the previous booking.</span>
                </span>
                <input type="checkbox" checked={renewal} onChange={(e) => setRenewal(e.target.checked)} />
              </label>
              <div className="mt-5 bg-[color:var(--surface)] p-4">
                <p className="eyebrow">All Syllis / 3 days</p>
                <p className="mt-2 text-2xl font-semibold">£{Math.round(adPricing.all[3] * (renewal ? adPricing.renewalMultiplier : 1))}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y hairline py-14">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="eyebrow">Ready to test the seller side?</p>
            <p className="mt-2 text-xl font-semibold">Join the early brand waitlist.</p>
          </div>
          <Link href="/waitlist" className="button button-dark" data-cursor="JOIN">
            Join waitlist <Store size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
