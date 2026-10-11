import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, ok, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";

/**
 * Creating an order directly is no longer allowed: it trusted a
 * client-supplied `total_amount`, which let a tampered browser under-pay.
 * Orders are now created by POST /api/checkout, which re-prices the cart on
 * the server, and confirmed by POST /api/checkout/verify once Paystack
 * verification succeeds. This endpoint is kept only to return a clear error
 * to any old client still calling it.
 */
export const POST = withErrorHandling(async () => {
  return fail(
    "Direct order creation is disabled. Use POST /api/checkout, then /api/checkout/verify.",
    410
  );
});

export const GET = withErrorHandling(async () => {
  const { user, response } = await requireRole();
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  // Scoped to the signed-in user, so one user never sees another's orders.
  const orders = await Order.find({ user_id: user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return ok(orders);
});
