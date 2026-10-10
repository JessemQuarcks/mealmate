import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { hasRole } from "@/lib/roles";
import VendorNav from "@/components/vendor/VendorNav";
import VendorOrders from "@/components/vendor/VendorOrders";

export default async function VendorOrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?callbackUrl=/vendor/orders");
  if (!hasRole(user.role, "vendor")) redirect("/forbidden");

  return (
    <div className="max-w-4xl mx-auto my-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Incoming orders</h1>
      <VendorNav />
      <VendorOrders />
    </div>
  );
}
