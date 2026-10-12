import { z } from "zod";
import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { isDeliveryComplete, OrderStatus } from "@/lib/orderStatus";

export const dynamic = "force-dynamic";

function orderIdFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("orders") + 1] ?? "";
}

const star = z.number().int().min(1).max(5);
const rateSchema = z
  .object({
    courier: star.optional(),
    restaurant: star.optional(),
    comment: z.string().max(500).optional(),
  })
  .refine((v) => v.courier !== undefined || v.restaurant !== undefined, {
    message: "Rate the courier, the restaurant, or both",
  });

/**
 * Let a customer rate the courier and/or restaurant once an order is
 * delivered. Owner-scoped; ratings before delivery are rejected.
 */
export const POST = withErrorHandling(async (req) => {
  const { user, response } = await requireRole();
  if (response) return response;

  const { data, error } = await parseBody(req, rateSchema);
  if (error) return error;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const order = await Order.findOne({ _id: orderIdFromUrl(req.url), user_id: user.id });
  if (!order) return fail("Order not found", 404);

  if (!isDeliveryComplete(order.status as OrderStatus)) {
    return fail("You can rate an order once it has been delivered", 409);
  }

  order.ratings = {
    courier: data.courier,
    restaurant: data.restaurant,
    comment: data.comment,
    ratedAt: new Date(),
  };
  await order.save();

  logger.info("Order rated", { order: order.id, user: user.id });
  return ok(order.toObject());
});
