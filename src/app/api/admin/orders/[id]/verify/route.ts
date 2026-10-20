import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { verifyTransaction } from "@/lib/paystack/verify";
import { reconcilePayment } from "@/lib/paystack/reconcile";
import { canTransitionPayment, PaymentStatus } from "@/lib/paymentStatus";
import { buildEvent, ORDER_EVENTS } from "@/lib/orderEvents";

export const dynamic = "force-dynamic";

function idFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("orders") + 1] ?? "";
}

/**
 * Admin re-verifies a pending order against Paystack (reconciliation). Confirms
 * it paid when the charge reconciles, or marks it failed. Idempotent for orders
 * already paid.
 */
export const POST = withErrorHandling(async (req) => {
  const { user, response } = await requireRole("admin");
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const order = await Order.findById(idFromUrl(req.url));
  if (!order || !order.payment) return fail("Order not found", 404);
  if (order.payment.status === "paid") return ok(order.toObject());

  const current = order.payment.status as PaymentStatus;
  const verification = await verifyTransaction(order.payment.reference);

  if (!verification.ok) {
    if (canTransitionPayment(current, "failed")) {
      order.payment.status = "failed";
      await order.save();
    }
    return fail(verification.reason, 402);
  }

  const result = reconcilePayment(verification.transaction, {
    amountMinor: order.payment.amountMinor,
    currency: order.payment.currency,
    reference: order.payment.reference,
  });

  if (!result.ok) {
    if (canTransitionPayment(current, "failed")) {
      order.payment.status = "failed";
      await order.save();
    }
    logger.error("Admin reconcile mismatch", { order: order.id, reason: result.reason });
    return fail("Payment could not be reconciled", 402);
  }

  order.payment.status = "paid";
  order.payment.verifiedAt = new Date();
  order.events.push(buildEvent(ORDER_EVENTS.paid));
  await order.save();

  logger.info("Admin reconciled order to paid", { order: order.id, by: user.id });
  return ok(order.toObject());
});
