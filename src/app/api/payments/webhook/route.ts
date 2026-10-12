import crypto from "crypto";
import { NextResponse } from "next/server";
import Order from "@/models/order";
import Cart from "@/models/cart";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok } from "@/lib/http";
import { reconcilePayment } from "@/lib/paystack/reconcile";
import { canTransitionPayment, PaymentStatus } from "@/lib/paymentStatus";
import { buildEvent, ORDER_EVENTS } from "@/lib/orderEvents";

export const dynamic = "force-dynamic";

/**
 * Paystack webhook. Paystack signs each event with an HMAC-SHA512 of the raw
 * body keyed by the secret key, in the `x-paystack-signature` header. We verify
 * that signature before trusting anything, then confirm the matching order —
 * a backstop in case the browser never calls /api/checkout/verify (closed tab,
 * flaky network). Idempotent: an already-paid order is left untouched.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    logger.error("PAYSTACK_SECRET_KEY not set; rejecting webhook");
    return fail("Webhook not configured", 503);
  }

  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex");

  // Constant-time compare to avoid leaking the signature via timing.
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    logger.warn("Rejected webhook with bad signature");
    return fail("Invalid signature", 401);
  }

  let event: { event?: string; data?: { reference?: string; amount?: number; currency?: string; status?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return fail("Invalid payload", 400);
  }

  if (event.event !== "charge.success" || !event.data?.reference) {
    // Acknowledge events we don't act on so Paystack stops retrying.
    return ok({ ignored: true });
  }

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const order = await Order.findOne({ "payment.reference": event.data.reference });
  if (!order || !order.payment) {
    logger.warn("Webhook for unknown order", { reference: event.data.reference });
    return ok({ ignored: true });
  }

  if (order.payment.status === "paid") return ok({ alreadyPaid: true });

  const result = reconcilePayment(
    {
      status: event.data.status ?? "",
      amount: event.data.amount ?? -1,
      currency: event.data.currency ?? "",
      reference: event.data.reference,
    },
    {
      amountMinor: order.payment.amountMinor,
      currency: order.payment.currency,
      reference: order.payment.reference,
    }
  );

  const current = order.payment.status as PaymentStatus;
  if (!result.ok) {
    if (canTransitionPayment(current, "failed")) {
      order.payment.status = "failed";
      await order.save();
    }
    logger.error("Webhook reconciliation failed", { order: order.id, reason: result.reason });
    return ok({ reconciled: false });
  }

  order.payment.status = "paid";
  order.payment.verifiedAt = new Date();
  order.events.push(buildEvent(ORDER_EVENTS.paid));
  await order.save();
  if (order.user_id) {
    await Cart.findOneAndUpdate({ user_id: order.user_id }, { restaurant_id: undefined, items: [] });
  }

  logger.info("Order confirmed via webhook", { order: order.id });
  return ok({ confirmed: true });
}
