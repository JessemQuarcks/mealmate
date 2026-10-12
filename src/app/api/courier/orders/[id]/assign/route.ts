import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok, withErrorHandling } from "@/lib/http";
import { requireActiveCourier } from "@/lib/courier";
import { buildEvent, ORDER_EVENTS } from "@/lib/orderEvents";

export const dynamic = "force-dynamic";

function orderIdFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("orders") + 1] ?? "";
}

/**
 * Claim a ready, unassigned order for delivery. The update is conditional on
 * the order still being `ready` with no courier, so two couriers racing for the
 * same order can't both win — the loser gets a 409.
 */
export const POST = withErrorHandling(async (req) => {
  const { user, response } = await requireActiveCourier();
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const now = new Date();
  const order = await Order.findOneAndUpdate(
    {
      _id: orderIdFromUrl(req.url),
      status: "ready",
      "courier.user_id": { $exists: false },
    },
    {
      $set: {
        courier: {
          user_id: user.id,
          name: user.name ?? undefined,
          assignedAt: now,
        },
      },
      $push: { events: buildEvent(ORDER_EVENTS.courierAssigned, undefined, now) },
    },
    { new: true }
  ).lean();

  if (!order) {
    return fail("This order is no longer available to claim", 409);
  }

  logger.info("Order claimed by courier", { order: String(order._id), courier: user.id });
  return ok(order);
});
