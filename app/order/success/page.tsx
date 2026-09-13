import Link from "next/link";
import { ensureTrackTokens, fulfillProductSession, type OrderRow } from "@/lib/orders-fulfill";
import { getStripe } from "@/lib/stripe";
import { T } from "@/lib/tables";
import { createServiceClient } from "@/lib/supabase/service";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  let token: string | null = null;
  let productName: string | null = null;

  if (sessionId) {
    const stripe = getStripe();
    const supabase = createServiceClient();
    if (stripe && supabase) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.metadata?.kind === "product" && session.payment_status === "paid") {
          await fulfillProductSession(session);
        }
        const orderId = session.metadata?.orderId;
        if (orderId) {
          const { data } = await supabase.from(T.orders).select("*").eq("id", orderId).maybeSingle();
          if (data) {
            const [order] = await ensureTrackTokens([data as OrderRow]);
            token = order.track_token ?? null;
            productName = order.product_name;
          }
        }
      } catch {
        // Receipt still stands if webhook is slower than this page.
      }
    }
  }

  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-4">Checkout</p>
      <h1 className="text-5xl font-semibold tracking-[-.06em]">You are in.</h1>
      <p className="mt-4 max-w-md text-sm text-[color:var(--muted)]">
        {productName ? `${productName} is paid.` : "You have already paid Syllis."} The label adds
        tracking. Follow the parcel here. They get paid when the courier marks it delivered — you
        do not have to confirm.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {token ? (
          <Link href={`/order/${token}`} className="button button-dark">
            Track this order
          </Link>
        ) : (
          <Link href="/order" className="button button-dark">
            Find your order
          </Link>
        )}
        <Link href="/discover" className="button button-quiet">
          Back to Discover
        </Link>
      </div>
    </div>
  );
}
