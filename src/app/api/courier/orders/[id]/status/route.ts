import { z } from "zod";
import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireActiveCourier } from "@/lib/courier";
import { courierCanSet, OrderStatus } from "@/lib/orderStatus";
import { buildEvent, ORDER_EVENTS } from "@/lib/orderEvents";

export const dynamic = "force-dynamic";

function orderIdFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("orders") + 1] ?? "";
}

const statusSchema = z.object({
  status: z.enum(["out_for_delivery", "delivered"]),
  proof: z
    .object({ note: z.string().max(280).optional(), photoUrl: z.string().url().optional() })
    .optional(),
});

/**
 * Advance the delivery leg: picked up (out_for_delivery) or delivered. The
 * courier must own the assignment, the transition must be legal, and marking
 * delivered captures proof of delivery and timestamps it.
 */
export const PATCH = withErrorHandling(async (req) => {
  const { user, response } = await requireActiveCourier();
  if (response) return response;

  const { data, error } = await parseBody(req, statusSchema);
  if (error) return error;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const order = await Order.findById(orderIdFromUrl(req.url));
  if (!order) return fail("Order not found", 404);

  // Ownership: only the assigned courier (or an admin) may advance it.
  if (user.role !== "admin" && order.courier?.user_id !== user.id) {
    return fail("You are not assigned to this delivery", 403);
  }

  if (!courierCanSet(order.status as OrderStatus, data.status)) {
    return fail(`Cannot move a ${order.status} order to ${data.status}`, 422);
  }

  const now = new Date();
  order.status = data.status;

  if (data.status === "out_for_delivery") {
    order.events.push(buildEvent(ORDER_EVENTS.pickedUp, undefined, now));
  } else {
    order.proof_of_delivery = {
      note: data.proof?.note,
      photoUrl: data.proof?.photoUrl,
      deliveredAt: now,
    };
    order.events.push(buildEvent(ORDER_EVENTS.delivered, data.proof?.note, now));
  }

  await order.save();
  logger.info("Delivery status updated", { order: order.id, status: data.status, courier: user.id });
  return ok(order.toObject());
});
