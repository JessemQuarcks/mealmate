/**
 * Order dispute lifecycle. A customer opens a dispute on an order; an admin
 * resolves or rejects it. Kept tiny and validated like the other state
 * machines (orderStatus, paymentStatus).
 */
export const DISPUTE_STATUSES = ["open", "resolved", "rejected"] as const;
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

/** An admin may move an open dispute to resolved or rejected — nothing else. */
export function disputeCanResolve(from: DisputeStatus, to: DisputeStatus): boolean {
  return from === "open" && (to === "resolved" || to === "rejected");
}
