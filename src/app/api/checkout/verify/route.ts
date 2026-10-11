import { z } from "zod";
import Order from "@/models/order";
import Cart from "@/models/cart";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { verifyTransaction } from "@/lib/paystack/verify";
import { reconcilePayment } from "@/lib/paystack/reconcile";
import { canTransitionPayment, PaymentStatus } from "@/lib/paymentStatus";
import { isValidReference } from "@/lib/paystack/reference";

export const dynamic = "force-dynamic";

const verifySchema = z.object({ reference: z.string().min(1) });

/**
 * Confirm a payment. The browser reports a successful Paystack charge; this
 * route independently verifies it with Paystack, reconciles the amount against
 * what the order expected, and only then marks the payment `paid`. A mismatch
 * marks it `failed`. Re-verifying an already-paid order is a no-op success.
 */
export const POST = withErrorHandling(async (req) => {
  const { user, response } = await requireRole();
  if (response) return response;

  const { data, error } = await parseBody(req, verifySchema);
  if (error) return error;

  if (!isValidReference(data.reference)) {
    return fail("Unrecognised payment reference", 422);
  }

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  // Scope to the signed-in user so one user can't confirm another's order.
  const order = await Order.findOne({
    user_id: user.id,
    "payment.reference": data.reference,
  });
  if (!order || !order.payment) return fail("Order not found", 404);

  // Idempotent: already-paid orders just return their current state.
  if (order.payment.status === "paid") {
    return ok(order.toObject());
  }

  const current = order.payment.status as PaymentStatus;

  const verification = await verifyTransaction(data.reference);
  if (!verification.ok) {
    if (canTransitionPayment(current, "failed")) {
      order.payment.status = "failed";
      await order.save();
    }
    logger.warn("Payment verification failed", {
      order: order.id,
      reason: verification.reason,
    });
    return fail(verification.reason, 402);
  }

  const result = reconcilePayment(verification.transaction, {
    amountMinor: order.payment.amountMinor,
    currency: order.payment.currency,
    reference: data.reference,
  });

  if (!result.ok) {
    if (canTransitionPayment(current, "failed")) {
      order.payment.status = "failed";
      await order.save();
    }
    logger.error("Payment reconciliation failed", { order: order.id, reason: result.reason });
    return fail("Payment could not be reconciled", 402);
  }

  order.payment.status = "paid";
  order.payment.verifiedAt = new Date();
  await order.save();

  // Payment settled: empty the server cart so it isn't re-ordered.
  await Cart.findOneAndUpdate(
    { user_id: user.id },
    { restaurant_id: undefined, items: [] }
  );

  logger.info("Payment verified", { order: order.id, user: user.id });
  return ok(order.toObject());
});
