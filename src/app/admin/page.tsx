import AdminMetrics from "@/components/admin/AdminMetrics";
import ReconciliationCard from "@/components/admin/ReconciliationCard";

// Access is enforced by the admin layout (and middleware).
export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <AdminMetrics />
      <ReconciliationCard />
    </div>
  );
}
