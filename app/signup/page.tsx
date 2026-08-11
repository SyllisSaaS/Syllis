"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function SignupPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="page-shell section-space">
        <p className="eyebrow mb-4">Account demo</p>
        <h1 className="text-[clamp(52px,8vw,100px)] font-semibold leading-[.86] tracking-[-.075em]">Welcome to Syllis.</h1>
        <p className="mt-6 max-w-lg text-sm leading-6 text-[color:var(--muted)]">
          This is the demo account flow. Connect this form to your auth provider when you move the project into production.
        </p>
        <Link href="/" className="button button-dark mt-8" data-cursor="HOME">Back home <ArrowRight size={15} /></Link>
      </div>
    );
  }

  return (
    <div className="page-shell section-space">
      <div className="mx-auto max-w-lg">
        <p className="eyebrow mb-4">Create account</p>
        <h1 className="text-5xl font-semibold tracking-[-.06em]">Start discovering.</h1>
        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="mt-9 grid gap-5 border hairline p-7">
          <label className="grid gap-2 text-xs">
            Name
            <input required className="border hairline bg-transparent px-3 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-xs">
            Email
            <input required type="email" className="border hairline bg-transparent px-3 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-xs">
            Password
            <input required type="password" className="border hairline bg-transparent px-3 py-3 outline-none" />
          </label>
          <button className="button button-dark w-full" data-cursor="JOIN">Create free account <ArrowRight size={15} /></button>
        </form>
      </div>
    </div>
  );
}
