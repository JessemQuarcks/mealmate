import { getRestaurantModel } from "@/models/restaurant";
import { fail, ok, withErrorHandling } from "@/lib/http";
import { requireActiveVendor } from "@/lib/vendor";

export const dynamic = "force-dynamic";

/** List the restaurants the signed-in vendor owns (all, for an admin). */
export const GET = withErrorHandling(async () => {
  const { user, response } = await requireActiveVendor();
  if (response) return response;

  const Restaurant = await getRestaurantModel();
  if (!Restaurant) return fail("Database is not available", 503);

  const filter = user.role === "admin" ? {} : { ownerUserId: user.id };
  const restaurants = await Restaurant.find(filter).sort({ updatedAt: -1 }).lean();
  return ok(restaurants);
});
