import { logger } from "@/lib/http";
import type { VerifiedTransaction } from "./reconcile";

/**
 * Server-side Paystack transaction verification. The browser can claim a
 * payment succeeded, but only Paystack's API can confirm it — so we call
 * `GET /transaction/verify/:reference` with the SECRET key (never exposed to
 * the client) and return a normalised {@link VerifiedTransaction}.
 */

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export type VerifyResult =
  | { ok: true; transaction: VerifiedTransaction }
  | { ok: false; reason: string };

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    status: string;
    amount: number;
    currency: string;
    reference: string;
  };
}

/**
 * Verify a transaction by reference. Returns a normalised transaction or a
 * reason it could not be verified. Network and key errors are returned, not
 * thrown, so callers can respond with a clean 4xx/5xx.
 */
export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    logger.error("PAYSTACK_SECRET_KEY is not set; cannot verify payments");
    return { ok: false, reason: "Payment verification is not configured" };
  }

  let res: Response;
  try {
    res = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${secret}` },
        // Verification must hit the live API, never a cached response.
        cache: "no-store",
      }
    );
  } catch (err) {
    logger.error("Paystack verify request failed", err);
    return { ok: false, reason: "Could not reach the payment provider" };
  }

  const body = (await res.json().catch(() => null)) as PaystackVerifyResponse | null;
  if (!res.ok || !body?.status || !body.data) {
    return { ok: false, reason: body?.message || `Verification failed (HTTP ${res.status})` };
  }

  const { status, amount, currency, reference: ref } = body.data;
  return { ok: true, transaction: { status, amount, currency, reference: ref } };
}
