import Link from "next/link";

export default function OrderSuccessPage() {
  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-4">Checkout</p>
      <h1 className="text-5xl font-semibold tracking-[-.06em]">You are in.</h1>
      <p className="mt-4 max-w-md text-sm text-[color:var(--muted)]">
        The label has the order. They ship it, add tracking, and then they get paid. You will get a
        Stripe receipt at the email you used.
      </p>
      <Link href="/discover" className="button button-dark mt-8">
        Back to Discover
      </Link>
    </div>
  );
}
