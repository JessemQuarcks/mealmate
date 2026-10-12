import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import OrderTracker from "@/components/tracking/OrderTracker";

interface TrackPageProps {
  params: { id: string };
}

export default async function TrackOrderPage({ params }: TrackPageProps) {
  const user = await getSessionUser();
  if (!user) redirect(`/signin?callbackUrl=/track/${params.id}`);

  return (
    <div className="max-w-2xl mx-auto my-10 px-4">
      <h1 className="section-title mb-6">Track your order</h1>
      <OrderTracker orderId={params.id} />
    </div>
  );
}
