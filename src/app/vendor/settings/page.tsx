import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { hasRole } from "@/lib/roles";
import VendorNav from "@/components/vendor/VendorNav";
import StorefrontSettings from "@/components/vendor/StorefrontSettings";

export default async function VendorSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?callbackUrl=/vendor/settings");
  if (!hasRole(user.role, "vendor")) redirect("/forbidden");

  return (
    <div className="max-w-4xl mx-auto my-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Storefront settings</h1>
      <VendorNav />
      <StorefrontSettings />
    </div>
  );
}
