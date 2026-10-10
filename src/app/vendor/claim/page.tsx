import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { hasRole } from "@/lib/roles";
import VendorNav from "@/components/vendor/VendorNav";
import ClaimRestaurant from "@/components/vendor/ClaimRestaurant";

export default async function VendorClaimPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?callbackUrl=/vendor/claim");
  if (!hasRole(user.role, "vendor")) redirect("/forbidden");

  return (
    <div className="max-w-4xl mx-auto my-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Claim a listing</h1>
      <VendorNav />
      <ClaimRestaurant />
    </div>
  );
}
