import { z } from "zod";
import { getRestaurantModel } from "@/models/restaurant";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireActiveVendor } from "@/lib/vendor";

export const dynamic = "force-dynamic";

const claimSchema = z.object({ restaurantId: z.string().min(1) });

/**
 * Claim an unowned restaurant listing. The vendor account is already
 * admin-verified (active), so a successful claim grants ownership immediately.
 */
export const POST = withErrorHandling(async (req) => {
  const { user, response } = await requireActiveVendor();
  if (response) return response;

  const { data, error } = await parseBody(req, claimSchema);
  if (error) return error;

  const Restaurant = await getRestaurantModel();
  if (!Restaurant) return fail("Database is not available", 503);

  const restaurant = await Restaurant.findById(data.restaurantId);
  if (!restaurant) return fail("Restaurant not found", 404);

  if (restaurant.ownerUserId && restaurant.ownerUserId !== user.id) {
    return fail("This restaurant has already been claimed", 409);
  }

  restaurant.ownerUserId = user.id;
  await restaurant.save();

  logger.info("Restaurant claimed", { restaurant: data.restaurantId, by: user.id });
  return ok({ id: restaurant.id, name: restaurant.name });
});
