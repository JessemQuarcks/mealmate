/**
 * Role model for MealMate. Four roles, as laid out in the roadmap:
 * - client:  default role for anyone who signs up to order food
 * - vendor:  a restaurant managing its storefront (verified in Phase 3)
 * - courier: a delivery rider (dispatch handled in Phase 5)
 * - admin:   platform operator
 */
export const ROLES = ["client", "vendor", "admin", "courier"] as const;
export type Role = (typeof ROLES)[number];

export const DEFAULT_ROLE: Role = "client";

/** Roles a person may self-select at registration. admin is never self-assigned. */
export const SELF_ASSIGNABLE_ROLES: Role[] = ["client", "vendor", "courier"];

/** Account status, used for vendor/courier verification gating. */
export const ACCOUNT_STATUSES = ["active", "pending", "suspended"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Does `role` satisfy a requirement of `allowed`? admin is a superset and
 * satisfies every requirement.
 */
export function hasRole(role: Role | undefined, allowed: Role | Role[]): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  const list = Array.isArray(allowed) ? allowed : [allowed];
  return list.includes(role);
}

/**
 * Which roles may access a given pathname. Used by middleware and UI guards so
 * the rules live in exactly one place. `null` means "any authenticated user".
 */
export function requiredRolesForPath(pathname: string): Role[] | null | undefined {
  if (pathname.startsWith("/admin")) return ["admin"];
  if (pathname.startsWith("/vendor")) return ["vendor"];
  if (pathname.startsWith("/courier")) return ["courier"];
  if (
    pathname.startsWith("/account") ||
    pathname.startsWith("/Checkout") ||
    pathname.startsWith("/history")
  ) {
    return null; // any signed-in user
  }
  return undefined; // public
}

/** True when a signed-in user with `role` may view `pathname`. */
export function canAccessPath(pathname: string, role: Role | undefined): boolean {
  const required = requiredRolesForPath(pathname);
  if (required === undefined) return true; // public route
  if (required === null) return !!role; // any authenticated user
  return hasRole(role, required);
}
