import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { hasRole } from "@/lib/roles";
import VendorNav from "@/components/vendor/VendorNav";
import MenuManager from "@/components/vendor/MenuManager";

export default async function VendorMenuPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?callbackUrl=/vendor/menu");
  if (!hasRole(user.role, "vendor")) redirect("/forbidden");

  return (
    <div className="max-w-4xl mx-auto my-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Menu</h1>
      <VendorNav />
      <MenuManager />
    </div>
  );
}
