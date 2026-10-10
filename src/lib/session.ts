import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRole, Role } from "@/lib/roles";
import { fail } from "@/lib/http";
import { NextResponse } from "next/server";

export interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role: Role;
  status: string;
}

/** Returns the signed-in user, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as unknown as SessionUser;
}

/**
 * For API routes: resolve the user and enforce an optional role requirement.
 * Returns either `{ user }` or `{ response }` — a ready 401/403 to return.
 */
export async function requireRole(
  allowed?: Role | Role[]
): Promise<{ user: SessionUser; response: null } | { user: null; response: NextResponse }> {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, response: fail("Authentication required", 401) };
  }
  if (allowed && !hasRole(user.role, allowed)) {
    return { user: null, response: fail("You do not have access to this resource", 403) };
  }
  return { user, response: null };
}
