/** Helpers for building MongoDB geospatial queries against a 2dsphere index. */

export const DEFAULT_RADIUS_METERS = 5000;
export const MAX_RADIUS_METERS = 50000;

/** Parse a query-string coordinate into a valid number, or undefined. */
export function parseCoordParam(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Clamp a requested radius into a sane range. */
export function clampRadius(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_RADIUS_METERS;
  }
  return Math.min(value, MAX_RADIUS_METERS);
}

/**
 * Build a `$near` filter on the `location` field. Returned to be spread into a
 * Mongoose `find`. Coordinates are GeoJSON order: [lng, lat].
 */
export function nearbyFilter(lng: number, lat: number, radiusMeters: number) {
  return {
    location: {
      $near: {
        $geometry: { type: "Point" as const, coordinates: [lng, lat] },
        $maxDistance: radiusMeters,
      },
    },
  };
}
