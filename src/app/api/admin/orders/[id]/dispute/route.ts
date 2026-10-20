import { z } from "zod";
import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { disputeCanResolve, DisputeStatus } from "@/lib/dispute";
import { canTransitionPayment, PaymentStatus } from "@/lib/paymentStatus";
import { refundTransaction } from "@/lib/paystack/refund";
import { buildEvent, ORDER_EVENTS } from "@/lib/orderEvents";

export const dynamic = "force-dynamic";

function idFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("orders") + 1] ?? "";
}

const resolveSchema = z.object({
  status: z.enum(["resolved", "rejected"]),
  note: z.string().max(500).optional(),
  refund: z.boolean().optional(),
});

/**
 * Admin resolves or rejects an open dispute, optionally issuing a full refund
 * as part of resolving it.
 */
export const PATCH = withErrorHandling(async (req) => {
  const { user, response } = await requireRole("admin");
  if (response) return response;

  const { data, error } = await parseBody(req, resolveSchema);
  if (error) return error;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const order = await Order.findById(idFromUrl(req.url));
  if (!order || !order.dispute) return fail("No dispute on this order", 404);

  const from = order.dispute.status as DisputeStatus;
  if (!disputeCanResolve(from, data.status)) {
    return fail(`A ${from} dispute cannot be ${data.status}`, 409);
  }

  const now = new Date();

  // Optional refund when resolving in the customer's favour.
  if (data.refund && order.payment) {
    const current = order.payment.status as PaymentStatus;
    if (canTransitionPayment(current, "refunded")) {
      const result = await refundTransaction(order.payment.reference, order.payment.amountMinor);
      if (!result.ok) return fail(result.reason, 502);
      order.payment.status = "refunded";
      order.refund = {
        amountMinor: order.payment.amountMinor,
        reference: result.reference,
        reason: data.note ?? "Dispute resolved",
        refundedAt: now,
      };
      order.events.push(buildEvent(ORDER_EVENTS.refunded, undefined, now));
    }
  }

  order.dispute.status = data.status;
  order.dispute.note = data.note ?? order.dispute.note;
  order.dispute.resolvedBy = user.id;
  order.dispute.resolvedAt = now;
  order.events.push(
    buildEvent(
      data.status === "resolved" ? ORDER_EVENTS.disputeResolved : ORDER_EVENTS.disputeRejected,
      data.note,
      now
    )
  );
  await order.save();

  logger.info("Dispute updated", { order: order.id, by: user.id, status: data.status });
  return ok(order.toObject());
});
