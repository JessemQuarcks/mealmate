import { getRestaurantModel } from "@/models/restaurant";
import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, ok, withErrorHandling } from "@/lib/http";
import { requireActiveVendor } from "@/lib/vendor";

export const dynamic = "force-dynamic";

/** Orders placed at the vendor's restaurant(s), newest first. */
export const GET = withErrorHandling(async () => {
  const { user, response } = await requireActiveVendor();
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const Restaurant = await getRestaurantModel();
  if (!Restaurant) return fail("Database is not available", 503);

  const filter = user.role === "admin" ? {} : { ownerUserId: user.id };
  const owned = await Restaurant.find(filter).select("_id").lean();
  const ids = owned.map((r) => String(r._id));

  if (ids.length === 0) return ok([]);

  const orders = await Order.find({ restaurant_id: { $in: ids } })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return ok(orders);
});
