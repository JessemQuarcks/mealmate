/**
 * Reconcile a verified Paystack transaction against the order we expected the
 * customer to pay. This is the guard that stops a tampered client from
 * confirming an order it under-paid for: we compare the *server-computed*
 * expected amount (in minor units) to what Paystack says was actually charged.
 */

export interface VerifiedTransaction {
  /** Paystack's transaction status; only "success" is a paid order. */
  status: string;
  /** Amount actually charged, in minor units (pesewas for GHS). */
  amount: number;
  currency: string;
  reference: string;
}

export interface ExpectedPayment {
  /** What we expected to charge, in minor units. */
  amountMinor: number;
  currency: string;
  reference: string;
}

export type ReconcileResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Returns `{ ok: true }` only when the transaction succeeded and its reference,
 * currency and amount all match what we expected. Any mismatch returns a
 * specific reason the caller can log — amounts are never "close enough".
 */
export function reconcilePayment(
  txn: VerifiedTransaction,
  expected: ExpectedPayment
): ReconcileResult {
  if (txn.status !== "success") {
    return { ok: false, reason: `transaction not successful (status: ${txn.status})` };
  }
  if (txn.reference !== expected.reference) {
    return {
      ok: false,
      reason: `reference mismatch (expected ${expected.reference}, got ${txn.reference})`,
    };
  }
  if (txn.currency !== expected.currency) {
    return {
      ok: false,
      reason: `currency mismatch (expected ${expected.currency}, got ${txn.currency})`,
    };
  }
  if (txn.amount !== expected.amountMinor) {
    return {
      ok: false,
      reason: `amount mismatch (expected ${expected.amountMinor}, got ${txn.amount})`,
    };
  }
  return { ok: true };
}
