import { OrderTracker } from "@/components/order-tracker";

export default async function OrderTrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="page-shell section-space">
      <OrderTracker token={token} />
    </div>
  );
}
