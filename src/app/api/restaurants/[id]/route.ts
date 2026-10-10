import { getRestaurantModel } from "@/models/restaurant";
import { fail, ok, withErrorHandling } from "@/lib/http";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

/** Fetch a single restaurant (with its menu) by Mongo _id or externalId. */
export const GET = withErrorHandling(async (req) => {
  const Restaurant = await getRestaurantModel();
  if (!Restaurant) return fail("Database is not available", 503);

  const id = req.url.split("/").pop()?.split("?")[0] ?? "";

  const or: Record<string, unknown>[] = [{ externalId: id }, { slug: id }];
  if (mongoose.Types.ObjectId.isValid(id)) {
    or.unshift({ _id: id });
  }

  const restaurant = await Restaurant.findOne({ $or: or }).lean();
  if (!restaurant) return fail("Restaurant not found", 404);

  return ok(restaurant);
});
