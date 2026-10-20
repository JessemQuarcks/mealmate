/**
 * Payment reconciliation helpers. An order can be left `pending` if the browser
 * never returned and the webhook never fired (closed tab, flaky network). These
 * split pending orders into "stale" (old enough to warrant an admin re-verify)
 * and "recent" (still in-flight), so money never silently goes unreconciled.
 */

export interface ReconcilableOrder {
  _id?: unknown;
  createdAt?: string | Date;
  total_amount?: number;
  restaurant_name?: string;
  payment?: { status?: string; reference?: string; amountMinor?: number };
}

/** Pending orders older than this are considered stale and surfaced to admins. */
export const DEFAULT_STALE_MS = 30 * 60 * 1000;

export function isStalePending(
  order: ReconcilableOrder,
  now: number = Date.now(),
  staleMs: number = DEFAULT_STALE_MS
): boolean {
  if (order.payment?.status !== "pending") return false;
  const created = order.createdAt ? new Date(order.createdAt).getTime() : 0;
  return now - created > staleMs;
}

/** Split a set of pending orders into stale vs still-recent. */
export function splitPending(
  orders: ReconcilableOrder[],
  now: number = Date.now(),
  staleMs: number = DEFAULT_STALE_MS
): { stale: ReconcilableOrder[]; recent: ReconcilableOrder[] } {
  const stale: ReconcilableOrder[] = [];
  const recent: ReconcilableOrder[] = [];
  for (const o of orders) {
    if (o.payment?.status !== "pending") continue;
    (isStalePending(o, now, staleMs) ? stale : recent).push(o);
  }
  return { stale, recent };
}
