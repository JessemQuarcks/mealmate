import { z } from "zod";
import Order from "@/models/order";
import { getRestaurantModel } from "@/models/restaurant";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireActiveVendor } from "@/lib/vendor";
import { ORDER_STATUSES, vendorCanSet, OrderStatus } from "@/lib/orderStatus";

export const dynamic = "force-dynamic";

function idFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("orders") + 1] ?? "";
}

const patchSchema = z.object({ status: z.enum(ORDER_STATUSES) });

/** Advance an order's status (accept / reject / preparing / ready). */
export const PATCH = withErrorHandling(async (req) => {
  const { user, response } = await requireActiveVendor();
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const { data, error } = await parseBody(req, patchSchema);
  if (error) return error;

  const order = await Order.findById(idFromUrl(req.url));
  if (!order) return fail("Order not found", 404);

  // Ownership: the order's restaurant must belong to this vendor.
  if (user.role !== "admin") {
    const Restaurant = await getRestaurantModel();
    const restaurant = order.restaurant_id
      ? await Restaurant?.findById(order.restaurant_id).select("ownerUserId").lean()
      : null;
    if (!restaurant || restaurant.ownerUserId !== user.id) {
      return fail("You do not manage this order", 403);
    }
  }

  if (!vendorCanSet(order.status as OrderStatus, data.status)) {
    return fail(`Cannot change order from ${order.status} to ${data.status}`, 422);
  }

  order.status = data.status;
  await order.save();

  logger.info("Order status updated", { order: order.id, status: data.status, by: user.id });
  return ok(order.toObject());
});
