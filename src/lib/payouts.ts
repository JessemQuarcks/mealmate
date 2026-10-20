/**
 * Vendor payout math. A vendor earns the food subtotal plus any tip on orders
 * that were actually paid, delivered and not refunded; the platform keeps the
 * service fee, and delivery fees are handled separately. This computes the
 * amount owed per vendor (and per restaurant) from a flat list of orders —
 * pure, so the admin payouts route can lean on it and it stays testable.
 */

export interface PayableOrder {
  restaurant_id?: string;
  restaurant_name?: string;
  ownerUserId?: string;
  subtotal?: number;
  tip?: number;
  total_amount?: number;
  status: string;
  payment?: { status?: string };
  refund?: unknown;
}

export interface VendorPayout {
  vendorUserId: string;
  restaurantId?: string;
  restaurantName?: string;
  owed: number;
  orderCount: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** True when an order has settled money the vendor should be paid for. */
export function isPayable(order: PayableOrder): boolean {
  return (
    order.payment?.status === "paid" &&
    order.status === "delivered" &&
    !order.refund
  );
}

/** A single order's contribution to the vendor payout (food + tip). */
export function orderEarnings(order: PayableOrder): number {
  const subtotal = order.subtotal ?? 0;
  const tip = order.tip ?? 0;
  return round2(subtotal + tip);
}

/**
 * Group payable orders by vendor (owner) and restaurant, summing earnings.
 * Orders missing an owner id are keyed by restaurant id so nothing is dropped.
 */
export function computeVendorPayouts(
  orders: PayableOrder[],
  ownerOf?: (restaurantId: string) => string | undefined
): VendorPayout[] {
  const byKey = new Map<string, VendorPayout>();

  for (const order of orders) {
    if (!isPayable(order)) continue;
    const restaurantId = order.restaurant_id;
    const vendorUserId =
      order.ownerUserId ?? (restaurantId && ownerOf?.(restaurantId)) ?? restaurantId ?? "unknown";
    const key = `${vendorUserId}:${restaurantId ?? ""}`;

    const existing =
      byKey.get(key) ??
      {
        vendorUserId,
        restaurantId,
        restaurantName: order.restaurant_name,
        owed: 0,
        orderCount: 0,
      };
    existing.owed = round2(existing.owed + orderEarnings(order));
    existing.orderCount += 1;
    byKey.set(key, existing);
  }

  return Array.from(byKey.values()).sort((a, b) => b.owed - a.owed);
}
