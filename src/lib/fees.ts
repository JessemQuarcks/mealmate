/**
 * Order money breakdown. The customer pays a *grand total* made of the item
 * subtotal plus a delivery fee, a platform service fee, tax and an optional
 * tip. Every value here is in major currency units (cedis); the Paystack
 * boundary converts the grand total to minor units (see src/lib/money.ts).
 *
 * This is the single source of truth for what an order costs. The client may
 * display it, but the server recomputes it at checkout so the charged amount
 * can never be tampered with from the browser.
 */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function clampNonNegative(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export interface FeeConfig {
  /** Flat delivery fee for the order, usually the restaurant's `deliveryFee`. */
  deliveryFee?: number;
  /** Platform service fee as a percentage of the subtotal (0–100). */
  serviceFeePercent?: number;
  /** Tax (e.g. VAT/NHIL) as a percentage of the subtotal (0–100). */
  taxPercent?: number;
  /** Customer tip, a flat major-unit amount. */
  tip?: number;
}

export interface OrderTotals {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  tip: number;
  /** subtotal + deliveryFee + serviceFee + tax + tip, rounded. */
  grandTotal: number;
}

/** Percentage of a base amount, clamped to 0–100 and rounded. */
function percentOf(base: number, percent: number | undefined): number {
  const pct = Math.min(100, clampNonNegative(percent ?? 0));
  return round2(base * (pct / 100));
}

/**
 * Compute the full money breakdown for an order from its item subtotal and the
 * applicable fee configuration. Negative or non-finite inputs are treated as 0
 * so a malformed value can never produce a negative charge.
 */
export function computeOrderTotals(subtotal: number, config: FeeConfig = {}): OrderTotals {
  const safeSubtotal = round2(clampNonNegative(subtotal));
  const deliveryFee = round2(clampNonNegative(config.deliveryFee ?? 0));
  const serviceFee = percentOf(safeSubtotal, config.serviceFeePercent);
  const tax = percentOf(safeSubtotal, config.taxPercent);
  const tip = round2(clampNonNegative(config.tip ?? 0));

  const grandTotal = round2(safeSubtotal + deliveryFee + serviceFee + tax + tip);

  return { subtotal: safeSubtotal, deliveryFee, serviceFee, tax, tip, grandTotal };
}
