import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { hasRole } from "@/lib/roles";

export default async function CourierDashboard() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?callbackUrl=/courier/dashboard");
  if (!hasRole(user.role, "courier")) redirect("/forbidden");

  return (
    <div className="max-w-3xl mx-auto my-12 px-4">
      <h1 className="text-2xl font-bold mb-2">Courier dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome, {user.name || user.email}.</p>

      {user.status !== "active" ? (
        <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-5">
          <h2 className="font-semibold mb-1">Your courier account is pending approval</h2>
          <p className="text-sm text-gray-700">
            An admin will verify you shortly. Delivery assignment and live tracking
            (Phase 5) unlock once your status is active.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-5 text-gray-600">
          Delivery assignment and live tracking arrive in Phase 5. Your account is
          verified and ready.
        </div>
      )}
    </div>
  );
}
