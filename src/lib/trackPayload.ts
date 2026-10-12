/**
 * Build the customer-facing tracking payload from an order. Shared by the
 * polling endpoint (GET /api/orders/:id/track) and the SSE stream so both emit
 * exactly the same shape. Pure: takes an order-like object, returns the DTO.
 */
import { haversineMeters, estimateEtaMinutes } from "@/lib/delivery";

export interface TrackableOrder {
  status: string;
  events?: { type: string; at: Date | string; note?: string }[];
  courier?: { name?: string } | null;
  courier_location?: { coordinates: [number, number]; updatedAt?: Date | string | null } | null;
  delivery_address?: { lat?: number; lng?: number } | null;
  proof_of_delivery?: { note?: string; photoUrl?: string; deliveredAt: Date | string } | null;
}

export interface TrackPayload {
  status: string;
  events: { type: string; at: Date | string; note?: string }[];
  courier: { name: string } | null;
  courier_location: { lat: number; lng: number; updatedAt: Date | string | null } | null;
  destination: { lat: number; lng: number } | null;
  proof_of_delivery: TrackableOrder["proof_of_delivery"];
  distance_meters: number | null;
  eta_minutes: number | null;
}

/** Terminal states: nothing more will change, so a stream can close. */
export function isTerminalStatus(status: string): boolean {
  return status === "delivered" || status === "cancelled" || status === "rejected";
}

export function buildTrackPayload(order: TrackableOrder): TrackPayload {
  const loc = order.courier_location;
  const dest = order.delivery_address;
  const courierPoint = loc?.coordinates
    ? { lng: loc.coordinates[0], lat: loc.coordinates[1] }
    : null;
  const destPoint =
    typeof dest?.lat === "number" && typeof dest?.lng === "number"
      ? { lat: dest.lat, lng: dest.lng }
      : null;

  let distance_meters: number | null = null;
  let eta_minutes: number | null = null;
  if (courierPoint && destPoint) {
    distance_meters = Math.round(haversineMeters(courierPoint, destPoint));
    eta_minutes = estimateEtaMinutes(distance_meters);
  }

  return {
    status: order.status,
    events: order.events ?? [],
    courier: order.courier ? { name: order.courier.name ?? "Your courier" } : null,
    courier_location: courierPoint
      ? { ...courierPoint, updatedAt: loc?.updatedAt ?? null }
      : null,
    destination: destPoint,
    proof_of_delivery: order.proof_of_delivery ?? null,
    distance_meters,
    eta_minutes,
  };
}
