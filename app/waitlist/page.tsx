"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

export default function WaitlistPage() {
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="page-shell section-space">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">Waitlist / received</p>
          <h1 className="text-[clamp(52px,8vw,100px)] font-semibold leading-[.86] tracking-[-.075em]">
            You&apos;re on the list.
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-6 text-[color:var(--muted)]">
            This demo stores nothing permanently yet. The form is ready to be connected to Supabase, Resend, a CRM or your eventual seller dashboard.
          </p>
          <Link href="/" className="button button-dark mt-8" data-cursor="HOME">
            Back home <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell section-space">
      <div className="grid gap-12 md:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="eyebrow mb-4">For independent brands</p>
          <h1 className="text-[clamp(52px,8vw,100px)] font-semibold leading-[.86] tracking-[-.075em]">
            Get in early.
          </h1>
          <p className="mt-6 max-w-md text-sm leading-6 text-[color:var(--muted)]">
            Add your brand to the demo waitlist so you can later turn this directly into your onboarding pipeline.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {["Early seller access", "Plan selection before launch", "Product catalogue onboarding", "Ad and discovery opportunities"].map((item) => (
              <li key={item} className="flex gap-3">
                <Check size={15} className="mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={submit} className="border hairline p-6 md:p-9">
          <div className="grid gap-5">
            <label className="grid gap-2 text-xs">
              Brand name
              <input required name="brand" className="border hairline bg-transparent px-3 py-3 outline-none" placeholder="e.g. North / 00" />
            </label>
            <label className="grid gap-2 text-xs">
              Contact email
              <input required type="email" name="email" className="border hairline bg-transparent px-3 py-3 outline-none" placeholder="you@brand.com" />
            </label>
            <label className="grid gap-2 text-xs">
              Instagram / website
              <input name="social" className="border hairline bg-transparent px-3 py-3 outline-none" placeholder="@yourbrand" />
            </label>
            <label className="grid gap-2 text-xs">
              What do you sell?
              <textarea name="description" rows={5} className="border hairline bg-transparent px-3 py-3 outline-none" placeholder="Tell us about your brand and product range." />
            </label>
            <button type="submit" className="button button-dark w-full" data-cursor="JOIN">
              Join brand waitlist <ArrowRight size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
