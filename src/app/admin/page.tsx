import AdminMetrics from "@/components/admin/AdminMetrics";

// Access is enforced by the admin layout (and middleware).
export default function AdminOverviewPage() {
  return <AdminMetrics />;
}
