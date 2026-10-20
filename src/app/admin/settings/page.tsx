import PlatformSettingsForm from "@/components/admin/PlatformSettingsForm";

export default function AdminSettingsPage() {
  return (
    <div>
      <h2 className="mb-1 font-display text-xl font-bold">Platform settings</h2>
      <p className="mb-5 text-muted">Fees charged at checkout.</p>
      <PlatformSettingsForm />
    </div>
  );
}
