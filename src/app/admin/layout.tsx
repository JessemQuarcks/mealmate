import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { hasRole } from "@/lib/roles";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/signin?callbackUrl=/admin");
  if (!hasRole(user.role, "admin")) redirect("/forbidden");

  return (
    <div className="container my-8">
      <div className="mb-5">
        <h1 className="section-title">Admin console</h1>
        <p className="text-muted">Run the marketplace — users, orders, catalogue, payouts.</p>
      </div>
      <AdminNav />
      {children}
    </div>
  );
}
