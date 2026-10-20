import { z } from "zod";
import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { buildEvent, ORDER_EVENTS } from "@/lib/orderEvents";

export const dynamic = "force-dynamic";

function idFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("orders") + 1] ?? "";
}

const disputeSchema = z.object({
  reason: z.string().min(3).max(120),
  note: z.string().max(500).optional(),
});

/**
 * Customer raises a dispute ("report a problem") on their own paid order.
 * One open dispute at a time; an admin resolves it from the console.
 */
export const POST = withErrorHandling(async (req) => {
  const { user, response } = await requireRole();
  if (response) return response;

  const { data, error } = await parseBody(req, disputeSchema);
  if (error) return error;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const order = await Order.findOne({ _id: idFromUrl(req.url), user_id: user.id });
  if (!order) return fail("Order not found", 404);

  if (order.payment?.status !== "paid") {
    return fail("Only a paid order can be disputed", 409);
  }
  if (order.dispute && order.dispute.status === "open") {
    return fail("A dispute is already open for this order", 409);
  }

  const now = new Date();
  order.dispute = {
    status: "open",
    reason: data.reason,
    note: data.note,
    raisedBy: user.id,
    raisedAt: now,
  };
  order.events.push(buildEvent(ORDER_EVENTS.disputeOpened, data.reason, now));
  await order.save();

  logger.info("Dispute opened", { order: order.id, user: user.id });
  return ok(order.toObject());
});
