import { getRestaurantModel } from "@/models/restaurant";
import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, ok, withErrorHandling } from "@/lib/http";
import { requireActiveVendor } from "@/lib/vendor";

export const dynamic = "force-dynamic";

/** Basic storefront analytics for the vendor's restaurant(s). */
export const GET = withErrorHandling(async () => {
  const { user, response } = await requireActiveVendor();
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const Restaurant = await getRestaurantModel();
  if (!Restaurant) return fail("Database is not available", 503);

  const filter = user.role === "admin" ? {} : { ownerUserId: user.id };
  const owned = await Restaurant.find(filter).select("_id menu").lean();
  const ids = owned.map((r) => String(r._id));
  const menuItems = owned.reduce((sum, r) => sum + (r.menu?.length ?? 0), 0);

  if (ids.length === 0) {
    return ok({ restaurants: 0, menuItems: 0, totalOrders: 0, pendingOrders: 0, revenue: 0 });
  }

  const orders = await Order.find({ restaurant_id: { $in: ids } })
    .select("status total_amount")
    .lean();

  const pendingOrders = orders.filter((o) => o.status === "placed").length;
  // Revenue counts orders that weren't rejected or cancelled.
  const revenue = orders
    .filter((o) => o.status !== "rejected" && o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.total_amount ?? 0), 0);

  return ok({
    restaurants: ids.length,
    menuItems,
    totalOrders: orders.length,
    pendingOrders,
    revenue: Math.round(revenue * 100) / 100,
  });
});
