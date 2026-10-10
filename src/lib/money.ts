/**
 * Money helpers. Paystack (and most PSPs) expect amounts in the currency's
 * smallest unit — pesewas for GHS, kobo for NGN — as an integer. Passing a
 * major-unit float (e.g. 12.5 cedis) silently under- or mis-charges, so always
 * convert at the boundary.
 */

/** Convert a major-unit amount (e.g. 12.50 GHS) to minor units (1250 pesewas). */
export function toMinorUnits(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`Invalid money amount: ${amount}`);
  }
  // Round to avoid floating-point drift (12.1 * 100 === 1209.9999999999998).
  return Math.round(amount * 100);
}

/** Convert minor units back to a major-unit number. */
export function fromMinorUnits(minor: number): number {
  return minor / 100;
}

/** Sum cart line items (price * quantity) into a major-unit total. */
export function cartTotal(
  items: ReadonlyArray<{ price: number; quantity: number }>
): number {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Keep two decimal places to avoid accumulated float error.
  return Math.round(total * 100) / 100;
}
