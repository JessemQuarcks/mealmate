/**
 * Order event timeline. Every meaningful step — placed, paid, accepted, picked
 * up, delivered — is appended as an event so the customer's tracking screen can
 * show a history, not just the current status. Kept framework-free and pure so
 * routes just push the returned object onto `order.events`.
 */

export interface OrderEvent {
  type: string;
  at: Date;
  note?: string;
}

/** Canonical event types, so UIs can map them to labels and icons. */
export const ORDER_EVENTS = {
  placed: "order.placed",
  paid: "payment.paid",
  accepted: "order.accepted",
  rejected: "order.rejected",
  preparing: "order.preparing",
  ready: "order.ready",
  courierAssigned: "courier.assigned",
  pickedUp: "courier.picked_up",
  delivered: "courier.delivered",
  cancelled: "order.cancelled",
  disputeOpened: "dispute.opened",
  disputeResolved: "dispute.resolved",
  disputeRejected: "dispute.rejected",
  refunded: "payment.refunded",
} as const;

/** Build a timeline event with a timestamp (defaults to now). */
export function buildEvent(type: string, note?: string, at: Date = new Date()): OrderEvent {
  return note ? { type, at, note } : { type, at };
}

const LABELS: Record<string, string> = {
  [ORDER_EVENTS.placed]: "Order placed",
  [ORDER_EVENTS.paid]: "Payment confirmed",
  [ORDER_EVENTS.accepted]: "Accepted by restaurant",
  [ORDER_EVENTS.rejected]: "Rejected by restaurant",
  [ORDER_EVENTS.preparing]: "Being prepared",
  [ORDER_EVENTS.ready]: "Ready for pickup",
  [ORDER_EVENTS.courierAssigned]: "Courier assigned",
  [ORDER_EVENTS.pickedUp]: "Picked up — on the way",
  [ORDER_EVENTS.delivered]: "Delivered",
  [ORDER_EVENTS.cancelled]: "Cancelled",
  [ORDER_EVENTS.disputeOpened]: "Problem reported",
  [ORDER_EVENTS.disputeResolved]: "Dispute resolved",
  [ORDER_EVENTS.disputeRejected]: "Dispute rejected",
  [ORDER_EVENTS.refunded]: "Refunded",
};

/** Human label for an event type, falling back to the raw type. */
export function describeEvent(type: string): string {
  return LABELS[type] ?? type;
}
