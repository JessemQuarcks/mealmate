/**
 * Paystack transaction references. A reference must be unique per transaction
 * and is the key we later verify against Paystack's API, so it is generated
 * server-side and stored on the order before the customer is sent to pay.
 */

const PREFIX = "mm";
const REFERENCE_RE = /^mm_[0-9a-z]+_[0-9a-z]{6,}$/i;

/**
 * Build a unique, URL-safe reference. The timestamp keeps references roughly
 * ordered; the random suffix makes collisions within the same millisecond
 * astronomically unlikely.
 */
export function buildPaymentReference(now: number = Date.now()): string {
  const time = Math.max(0, Math.floor(now)).toString(36);
  const random = Math.random().toString(36).slice(2, 10).padEnd(8, "0");
  return `${PREFIX}_${time}_${random}`;
}

/** True when a string looks like a reference we issued. */
export function isValidReference(reference: unknown): reference is string {
  return typeof reference === "string" && REFERENCE_RE.test(reference);
}
