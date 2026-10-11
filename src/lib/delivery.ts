/**
 * Delivery distance and ETA math. The customer tracking screen shows how far
 * the courier is and roughly how long until arrival; both are derived here from
 * the courier's last reported position and the drop-off point. Pure and
 * testable — no map SDK required.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_METERS = 6_371_000;
/** A conservative average for city delivery on a bike/scooter. */
export const DEFAULT_SPEED_KMH = 20;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two points, in metres (haversine). */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Estimated minutes to cover a distance at a given average speed. Always at
 * least 1 minute so "arriving" never shows 0, and rounded up.
 */
export function estimateEtaMinutes(
  distanceMeters: number,
  speedKmh: number = DEFAULT_SPEED_KMH
): number {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) return 1;
  if (!Number.isFinite(speedKmh) || speedKmh <= 0) speedKmh = DEFAULT_SPEED_KMH;
  const hours = distanceMeters / 1000 / speedKmh;
  return Math.max(1, Math.ceil(hours * 60));
}

/** Convenience: ETA in minutes between two points. */
export function etaBetween(
  from: LatLng,
  to: LatLng,
  speedKmh: number = DEFAULT_SPEED_KMH
): number {
  return estimateEtaMinutes(haversineMeters(from, to), speedKmh);
}

/** Human label for a distance, e.g. "850 m" or "2.3 km". */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "—";
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}
