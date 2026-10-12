/**
 * Browser-side helpers for the courier console. Thin, typed wrappers over the
 * /api/courier endpoints that unwrap the success/error envelope.
 */

export interface CourierOrderProduct {
  id: string;
  name: string;
  quantity: number;
}

export interface CourierOrder {
  _id: string;
  restaurant_name?: string;
  products: CourierOrderProduct[];
  total_amount: number;
  currency?: string;
  status: string;
  delivery_address?: { line1: string; city?: string };
  courier?: { name?: string };
}

export interface CourierFeed {
  available: CourierOrder[];
  active: CourierOrder[];
}

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new Error(body?.errors?.join(", ") || `Request failed (${res.status})`);
  }
  return body.data as T;
}

export async function getCourierOrders(): Promise<CourierFeed> {
  return parse<CourierFeed>(await fetch("/api/courier/orders", { cache: "no-store" }));
}

export async function claimOrder(id: string): Promise<CourierOrder> {
  return parse<CourierOrder>(
    await fetch(`/api/courier/orders/${id}/assign`, { method: "POST" })
  );
}

export async function setDeliveryStatus(
  id: string,
  status: "out_for_delivery" | "delivered",
  proof?: { note?: string; photoUrl?: string }
): Promise<CourierOrder> {
  return parse<CourierOrder>(
    await fetch(`/api/courier/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, proof }),
    })
  );
}

export async function pingLocation(
  id: string,
  coords: { lat: number; lng: number }
): Promise<void> {
  await fetch(`/api/courier/orders/${id}/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(coords),
  });
}
