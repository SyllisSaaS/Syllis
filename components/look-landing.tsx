"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLook } from "./look-provider";
import type { Look } from "@/lib/look";

export function LookLanding() {
  const { setLook } = useLook();

  function enter(look: Look) {
    setLook(look);
    window.location.assign("/home");
  }

  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-5">One Syllis. Two looks.</p>
      <h1 className="max-w-5xl text-[clamp(52px,9vw,120px)] font-semibold leading-[.84] tracking-[-.08em]">
        Pick the Syllis
        <br />
        that feels like you.
      </h1>
      <p className="mt-8 max-w-xl text-sm leading-6 text-[color:var(--muted)]">
        Same products, drops and accounts. Studio is sharp and black. Colour is rounded and
        playful. You can switch anytime from the header.
      </p>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        <button
          type="button"
          onClick={() => enter("studio")}
          className="look-card group border hairline p-0 text-left"
          data-cursor="STUDIO"
        >
          <div className="bg-[#0c0c0c] p-7 text-[#f5f4f0] md:min-h-[360px] md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#9a9993]">
              Look 01
            </p>
            <h2 className="mt-8 text-4xl font-semibold tracking-[-.06em] md:text-5xl">Studio</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#9a9993]">
              Black, sharp boxes, editorial type. Built to feel like a serious fashion index.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-2">
              <span className="h-16 bg-[#151515]" />
              <span className="h-16 bg-[#202020]" />
              <span className="h-16 bg-[#151515]" />
            </div>
            <p className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[.12em]">
              Enter Studio <ArrowRight size={14} />
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => enter("colour")}
          className="look-card group border hairline p-0 text-left"
          data-cursor="COLOUR"
        >
          <div className="relative overflow-hidden bg-[#f0ede8] p-7 text-[#111010] md:min-h-[360px] md:p-9">
            <span className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#f5a8c8] opacity-70 blur-2xl" />
            <span className="absolute -bottom-10 left-10 h-36 w-36 rounded-full bg-[#a8d4f5] opacity-70 blur-2xl" />
            <div className="relative">
              <p className="text-[10px] uppercase tracking-[.16em] text-[#7a7570]">Look 02</p>
              <h2 className="mt-8 text-4xl font-semibold tracking-[-.06em] md:text-5xl">Colour</h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#7a7570]">
                Pastel light, rounded cards, softer type. Same catalogue, a warmer room.
              </p>
              <div className="mt-10 grid grid-cols-3 gap-2">
                <span className="h-16 rounded-2xl bg-white/70" />
                <span className="h-16 rounded-2xl bg-white/70" />
                <span className="h-16 rounded-2xl bg-white/70" />
              </div>
              <p className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[.12em]">
                Enter Colour <ArrowRight size={14} />
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/signup" className="button button-dark" data-cursor="JOIN">
          Create a free account <ArrowRight size={15} />
        </Link>
        <Link href="/pricing" className="button button-quiet" data-cursor="PRICING">
          See plans
        </Link>
      </div>
    </div>
  );
}
