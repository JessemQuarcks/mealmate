import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { hasRole } from "@/lib/roles";
import VendorNav from "@/components/vendor/VendorNav";
import VendorOverview from "@/components/vendor/VendorOverview";

export default async function VendorDashboard() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?callbackUrl=/vendor/dashboard");
  if (!hasRole(user.role, "vendor")) redirect("/forbidden");

  return (
    <div className="max-w-4xl mx-auto my-12 px-4">
      <h1 className="text-2xl font-bold mb-1">Vendor dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome, {user.name || user.email}.</p>
      <VendorNav />

      {user.status !== "active" && user.role === "vendor" ? (
        <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-5">
          <h2 className="font-semibold mb-1">Your restaurant is pending approval</h2>
          <p className="text-sm text-gray-700">
            An admin will verify your account shortly. Once active, you can claim your
            listing and manage its menu, prices and availability here.
          </p>
        </div>
      ) : (
        <VendorOverview />
      )}
    </div>
  );
}
