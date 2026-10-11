/**
 * Payment lifecycle, kept separate from the fulfilment lifecycle in
 * src/lib/orderStatus.ts. An order has both: how it is being prepared/delivered
 * and whether it has been paid for. A payment starts `pending` (order created,
 * customer sent to Paystack), becomes `paid` once verified, `failed` if
 * verification is rejected, and `refunded` after a successful refund.
 */
export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const INITIAL_PAYMENT_STATUS: PaymentStatus = "pending";

const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ["paid", "failed"],
  paid: ["refunded"],
  failed: [],
  refunded: [],
};

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

/** True once money has actually been collected for the order. */
export function isPaid(status: PaymentStatus): boolean {
  return status === "paid";
}

/** True when a payment can still be refunded. */
export function isRefundable(status: PaymentStatus): boolean {
  return canTransitionPayment(status, "refunded");
}
