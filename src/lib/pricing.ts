/**
 * Pricing helpers for vendor discounts. Prices are major currency units (cedis);
 * the Paystack boundary converts to minor units (see src/lib/money.ts).
 */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Apply a percentage discount (0–100) to a price, clamped and rounded. */
export function discountedPrice(price: number, percent: number | undefined): number {
  if (!Number.isFinite(price) || price < 0) return 0;
  if (!percent || !Number.isFinite(percent) || percent <= 0) return round2(price);
  const pct = Math.min(100, percent);
  return round2(price * (1 - pct / 100));
}

/** The price a customer actually pays for a menu item after its discount. */
export function effectiveItemPrice(item: {
  price: number;
  discountPercent?: number;
}): number {
  return discountedPrice(item.price, item.discountPercent);
}

/** True when an item is currently buyable (available and priced). */
export function isItemOrderable(item: { available?: boolean; price: number }): boolean {
  return item.available !== false && Number.isFinite(item.price) && item.price >= 0;
}
