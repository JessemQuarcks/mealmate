/**
 * Order lifecycle. Vendors drive the early states (accept → preparing → ready);
 * couriers drive delivery states in Phase 5. Transitions are validated so an
 * order can never jump to an illegal state.
 */
export const ORDER_STATUSES = [
  "placed",
  "accepted",
  "rejected",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const INITIAL_STATUS: OrderStatus = "placed";

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ["accepted", "rejected", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  rejected: [],
  delivered: [],
  cancelled: [],
};

/** States a vendor is allowed to move an order into. */
export const VENDOR_SETTABLE: OrderStatus[] = [
  "accepted",
  "rejected",
  "preparing",
  "ready",
];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** Validate a vendor-initiated status change. */
export function vendorCanSet(from: OrderStatus, to: OrderStatus): boolean {
  return VENDOR_SETTABLE.includes(to) && canTransition(from, to);
}
