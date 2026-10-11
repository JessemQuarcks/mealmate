import { NextResponse } from "next/server";
import { getSessionUser, SessionUser } from "@/lib/session";
import { fail } from "@/lib/http";
import { hasRole } from "@/lib/roles";

/**
 * Resolve the signed-in user and require that they are an active (admin-
 * verified) courier, or an admin. Pending/suspended couriers are rejected with
 * a clear 403 — mirrors requireActiveVendor in src/lib/vendor.ts.
 */
export async function requireActiveCourier(): Promise<
  { user: SessionUser; response: null } | { user: null; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) return { user: null, response: fail("Authentication required", 401) };
  if (!hasRole(user.role, "courier")) {
    return { user: null, response: fail("Courier access required", 403) };
  }
  // Admins bypass the active-status gate.
  if (user.role === "courier" && user.status !== "active") {
    return { user: null, response: fail("Your courier account is pending approval", 403) };
  }
  return { user, response: null };
}
