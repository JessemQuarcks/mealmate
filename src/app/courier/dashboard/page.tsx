import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { hasRole } from "@/lib/roles";
import CourierConsole from "@/components/courier/CourierConsole";

export default async function CourierDashboard() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?callbackUrl=/courier/dashboard");
  if (!hasRole(user.role, "courier")) redirect("/forbidden");

  return (
    <div className="max-w-3xl mx-auto my-12 px-4">
      <h1 className="section-title mb-1">Courier dashboard</h1>
      <p className="text-muted mb-8">Welcome, {user.name || user.email}.</p>

      {user.status !== "active" ? (
        <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-5">
          <h2 className="font-semibold mb-1">Your courier account is pending approval</h2>
          <p className="text-sm text-muted">
            An admin will verify you shortly. Claiming deliveries and live location
            sharing unlock once your status is active.
          </p>
        </div>
      ) : (
        <CourierConsole />
      )}
    </div>
  );
}
