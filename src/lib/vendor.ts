import { NextResponse } from "next/server";
import { getSessionUser, SessionUser } from "@/lib/session";
import { fail } from "@/lib/http";
import { hasRole } from "@/lib/roles";
import { getRestaurantModel } from "@/models/restaurant";
import type { IRestaurant } from "@/models/restaurant";

/**
 * Resolve the signed-in user and require that they are a vendor (or admin) with
 * an active account. Pending/suspended vendors are rejected with a clear 403.
 */
export async function requireActiveVendor(): Promise<
  { user: SessionUser; response: null } | { user: null; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) return { user: null, response: fail("Authentication required", 401) };
  if (!hasRole(user.role, "vendor")) {
    return { user: null, response: fail("Vendor access required", 403) };
  }
  // Admins bypass the active-status gate.
  if (user.role === "vendor" && user.status !== "active") {
    return { user: null, response: fail("Your vendor account is pending approval", 403) };
  }
  return { user, response: null };
}

/**
 * Load a restaurant the user is allowed to manage (its owner, or an admin).
 * Returns the restaurant document or a ready error response.
 */
export async function loadOwnedRestaurant(
  user: SessionUser,
  restaurantId: string
): Promise<{ restaurant: IRestaurant; response: null } | { restaurant: null; response: NextResponse }> {
  const Restaurant = await getRestaurantModel();
  if (!Restaurant) return { restaurant: null, response: fail("Database is not available", 503) };

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return { restaurant: null, response: fail("Restaurant not found", 404) };

  const isOwner = restaurant.ownerUserId === user.id;
  if (!isOwner && user.role !== "admin") {
    return { restaurant: null, response: fail("You do not manage this restaurant", 403) };
  }
  return { restaurant, response: null };
}
