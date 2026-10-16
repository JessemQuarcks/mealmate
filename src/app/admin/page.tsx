import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { hasRole } from "@/lib/roles";
import AdminUsersTable from "@/components/AdminUsersTable";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?callbackUrl=/admin");
  if (!hasRole(user.role, "admin")) redirect("/forbidden");

  return (
    <div className="max-w-4xl mx-auto my-12 px-4">
      <h1 className="text-2xl font-bold mb-2">Admin console</h1>
      <p className="text-muted mb-6">
        Verify vendors and couriers, and manage account access.
      </p>
      <AdminUsersTable />
    </div>
  );
}
