import AdminUsersTable from "@/components/AdminUsersTable";

export default function AdminUsersPage() {
  return (
    <div>
      <h2 className="mb-1 font-display text-xl font-bold">Users</h2>
      <p className="mb-5 text-muted">Approve vendors/couriers, change roles, suspend accounts.</p>
      <AdminUsersTable />
    </div>
  );
}
