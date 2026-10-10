import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import SignOutButton from "@/components/SignOutButton";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?callbackUrl=/account");

  const roleHomes: Record<string, string> = {
    vendor: "/vendor/dashboard",
    admin: "/admin",
    courier: "/courier/dashboard",
  };
  const roleHome = roleHomes[user.role];

  return (
    <div className="max-w-xl mx-auto my-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Your account</h1>
      <dl className="space-y-3 border rounded-lg p-5">
        <div className="flex justify-between">
          <dt className="text-gray-500">Name</dt>
          <dd className="font-medium">{user.name || "—"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Email</dt>
          <dd className="font-medium">{user.email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Role</dt>
          <dd className="font-medium capitalize">{user.role}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Status</dt>
          <dd className="font-medium capitalize">{user.status}</dd>
        </div>
      </dl>

      {roleHome && (
        <a href={roleHome} className="inline-block mt-6 text-blue-600 underline">
          Go to your {user.role} area →
        </a>
      )}

      <div className="mt-8">
        <SignOutButton />
      </div>
    </div>
  );
}
