import { z } from "zod";
import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { canTransitionPayment, PaymentStatus } from "@/lib/paymentStatus";
import { refundTransaction } from "@/lib/paystack/refund";

export const dynamic = "force-dynamic";

function idFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("orders") + 1] ?? "";
}

const refundSchema = z.object({
  amountMinor: z.number().int().positive().optional(),
  reason: z.string().max(280).optional(),
});

/**
 * Admin refund for any paid order (full, or a partial `amountMinor`). Mirrors
 * the vendor refund but without an ownership check — used from order management
 * and dispute resolution.
 */
export const POST = withErrorHandling(async (req) => {
  const { user, response } = await requireRole("admin");
  if (response) return response;

  const { data, error } = await parseBody(req, refundSchema);
  if (error) return error;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const order = await Order.findById(idFromUrl(req.url));
  if (!order || !order.payment) return fail("Order not found", 404);

  const current = order.payment.status as PaymentStatus;
  if (!canTransitionPayment(current, "refunded")) {
    return fail(`A ${current} payment cannot be refunded`, 409);
  }

  const amountMinor = data.amountMinor ?? order.payment.amountMinor;
  if (amountMinor > order.payment.amountMinor) {
    return fail("Refund cannot exceed the amount charged", 422);
  }

  const result = await refundTransaction(order.payment.reference, amountMinor);
  if (!result.ok) {
    logger.error("Admin refund failed at provider", { order: order.id, reason: result.reason });
    return fail(result.reason, 502);
  }

  order.payment.status = "refunded";
  order.refund = {
    amountMinor,
    reference: result.reference,
    reason: data.reason,
    refundedAt: new Date(),
  };
  await order.save();

  logger.info("Admin refunded order", { order: order.id, by: user.id, amountMinor });
  return ok(order.toObject());
});
