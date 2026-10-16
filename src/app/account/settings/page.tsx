import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import ProfileSettings from "@/components/account/ProfileSettings";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?callbackUrl=/account/settings");

  return (
    <div className="container my-10 max-w-2xl">
      <Link href="/account" className="text-sm text-muted hover:text-brand">
        ← Back to account
      </Link>
      <h1 className="section-title mb-6 mt-2">Profile settings</h1>
      <ProfileSettings />
    </div>
  );
}
