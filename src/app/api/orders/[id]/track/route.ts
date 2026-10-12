import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, ok, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { haversineMeters, estimateEtaMinutes } from "@/lib/delivery";

export const dynamic = "force-dynamic";

function orderIdFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("orders") + 1] ?? "";
}

/**
 * Live tracking payload for the order's owner: current status, the event
 * timeline, the courier's last position and a derived distance + ETA to the
 * drop-off. The customer screen polls this; location itself is written by the
 * courier's location pings.
 */
export const GET = withErrorHandling(async (req) => {
  const { user, response } = await requireRole();
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const order = await Order.findOne({ _id: orderIdFromUrl(req.url), user_id: user.id }).lean();
  if (!order) return fail("Order not found", 404);

  const loc = order.courier_location;
  const dest = order.delivery_address;
  const courierPoint =
    loc?.coordinates ? { lng: loc.coordinates[0], lat: loc.coordinates[1] } : null;
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

  return ok({
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
  });
});
