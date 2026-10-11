import { z } from "zod";
import Order from "@/models/order";
import { getRestaurantModel } from "@/models/restaurant";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireActiveVendor } from "@/lib/vendor";
import { canTransitionPayment, PaymentStatus } from "@/lib/paymentStatus";
import { refundTransaction } from "@/lib/paystack/refund";

export const dynamic = "force-dynamic";

function orderIdFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("orders") + 1] ?? "";
}

const refundSchema = z.object({ reason: z.string().max(280).optional() });

/**
 * Refund a paid order. Vendor/admin only, and the order's restaurant must
 * belong to the vendor. The payment-status machine enforces that only a paid
 * order can be refunded; we refund in full via Paystack and record it.
 */
export const POST = withErrorHandling(async (req) => {
  const { user, response } = await requireActiveVendor();
  if (response) return response;

  const { data, error } = await parseBody(req, refundSchema);
  if (error) return error;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const order = await Order.findById(orderIdFromUrl(req.url));
  if (!order || !order.payment) return fail("Order not found", 404);

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

  const current = order.payment.status as PaymentStatus;
  if (!canTransitionPayment(current, "refunded")) {
    return fail(`A ${current} payment cannot be refunded`, 409);
  }

  const result = await refundTransaction(order.payment.reference, order.payment.amountMinor);
  if (!result.ok) {
    logger.error("Refund failed at provider", { order: order.id, reason: result.reason });
    return fail(result.reason, 502);
  }

  order.payment.status = "refunded";
  order.refund = {
    amountMinor: order.payment.amountMinor,
    reference: result.reference,
    reason: data.reason,
    refundedAt: new Date(),
  };
  await order.save();

  logger.info("Order refunded", { order: order.id, by: user.id });
  return ok(order.toObject());
});
