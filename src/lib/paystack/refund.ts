import { logger } from "@/lib/http";

/**
 * Server-side Paystack refunds. Calls `POST /refund` with the SECRET key. A
 * refund can be full (omit the amount) or partial (amount in minor units).
 * Like verification, failures are returned, not thrown, so routes can respond
 * cleanly.
 */

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export type RefundResult =
  | { ok: true; reference?: string }
  | { ok: false; reason: string };

interface PaystackRefundResponse {
  status: boolean;
  message: string;
  data?: { id?: number; transaction?: { reference?: string } };
}

/**
 * Refund a transaction by its reference. `amountMinor` refunds a partial
 * amount; omit it to refund in full.
 */
export async function refundTransaction(
  reference: string,
  amountMinor?: number
): Promise<RefundResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    logger.error("PAYSTACK_SECRET_KEY is not set; cannot issue refunds");
    return { ok: false, reason: "Refunds are not configured" };
  }

  const body: Record<string, unknown> = { transaction: reference };
  if (typeof amountMinor === "number") body.amount = amountMinor;

  let res: Response;
  try {
    res = await fetch(`${PAYSTACK_BASE_URL}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    logger.error("Paystack refund request failed", err);
    return { ok: false, reason: "Could not reach the payment provider" };
  }

  const json = (await res.json().catch(() => null)) as PaystackRefundResponse | null;
  if (!res.ok || !json?.status) {
    return { ok: false, reason: json?.message || `Refund failed (HTTP ${res.status})` };
  }

  return { ok: true, reference: json.data?.transaction?.reference };
}
