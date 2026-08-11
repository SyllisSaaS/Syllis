import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-4">Profile</p>
      <h1 className="text-[clamp(50px,8vw,100px)] font-semibold leading-[.86] tracking-[-.075em]">Your Syllis.</h1>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="border hairline p-6"><p className="eyebrow">Plan</p><p className="mt-2 text-2xl font-semibold">Free</p></div>
        <div className="border hairline p-6"><p className="eyebrow">Saved</p><p className="mt-2 text-2xl font-semibold">0</p></div>
        <div className="border hairline p-6"><p className="eyebrow">Early access</p><p className="mt-2 text-2xl font-semibold">Off</p></div>
      </div>
      <Link href="/pricing" className="button button-dark mt-8" data-cursor="PRICING">See plans</Link>
    </div>
  );
}
