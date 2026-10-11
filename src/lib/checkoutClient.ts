/**
 * Browser-side helpers for the Phase 4 checkout flow. The server owns pricing,
 * so the client only sends ids, quantities, a tip and an address, then pays the
 * reference and amount the server hands back.
 */
import type { OrderTotals } from "@/lib/fees";

export interface CheckoutAddress {
  label?: string;
  line1: string;
  line2?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

export interface InitCheckoutInput {
  restaurant_id: string;
  items: { id: string; quantity: number }[];
  tip?: number;
  delivery_address: CheckoutAddress;
}

export interface CheckoutInit {
  order_id: string;
  reference: string;
  email: string;
  /** Amount in minor units — Paystack's unit. */
  amount: number;
  currency: string;
  totals: OrderTotals;
}

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new Error(body?.errors?.join(", ") || `Request failed (${res.status})`);
  }
  return body.data as T;
}

/** Create a pending, server-priced order and get the Paystack details. */
export async function initCheckout(input: InitCheckoutInput): Promise<CheckoutInit> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parse<CheckoutInit>(res);
}

/** Confirm the order once Paystack reports success. */
export async function verifyPayment(reference: string): Promise<{ status: string }> {
  const res = await fetch("/api/checkout/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference }),
  });
  return parse<{ status: string }>(res);
}
