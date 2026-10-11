import { z } from "zod";
import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { canTransition, OrderStatus } from "@/lib/orderStatus";

export const dynamic = "force-dynamic";

function orderIdFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("orders") + 1] ?? "";
}

const cancelSchema = z.object({ reason: z.string().max(280).optional() });

/**
 * Let a customer cancel their own order while it is still cancellable (before
 * it is out for delivery). The status state machine decides what "cancellable"
 * means. A paid order is still cancelled here; refunding it is a separate
 * vendor/admin action so money movement stays deliberate.
 */
export const POST = withErrorHandling(async (req) => {
  const { user, response } = await requireRole();
  if (response) return response;

  const { data, error } = await parseBody(req, cancelSchema);
  if (error) return error;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const order = await Order.findOne({ _id: orderIdFromUrl(req.url), user_id: user.id });
  if (!order) return fail("Order not found", 404);

  if (!canTransition(order.status as OrderStatus, "cancelled")) {
    return fail(`An order that is ${order.status} can no longer be cancelled`, 409);
  }

  order.status = "cancelled";
  order.cancelled_at = new Date();
  if (data.reason) order.cancel_reason = data.reason;
  await order.save();

  logger.info("Order cancelled by customer", { order: order.id, user: user.id });
  return ok(order.toObject());
});
