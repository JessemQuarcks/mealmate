import { getRestaurantModel } from "@/models/restaurant";
import { fail, ok, withErrorHandling } from "@/lib/http";
import { nearbyFilter } from "@/lib/geo";
import { haversineMeters } from "@/lib/delivery";
import { rankRestaurants, RankSignals } from "@/lib/ranking";
import {
  parseRestaurantQuery,
  buildRestaurantMongoFilter,
  hasCoords,
} from "@/lib/restaurantFilters";

export const dynamic = "force-dynamic";

interface GeoRestaurant extends RankSignals {
  location?: { coordinates: [number, number] };
}

/**
 * Search & discover restaurants. Supports text (`q`), `cuisine`, `maxPrice`
 * (price level) and `openNow` filters, with `sort=rank|distance|rating`:
 *  - `rank` (default): blended ranking score (src/lib/ranking.ts), distance-aware
 *     when `lat`/`lng` are supplied.
 *  - `distance`: nearest-first via the 2dsphere `$near` query.
 *  - `rating`: top-rated first.
 */
export const GET = withErrorHandling(async (req) => {
  const Restaurant = await getRestaurantModel();
  if (!Restaurant) return fail("Database is not available", 503);

  const p = parseRestaurantQuery(new URL(req.url).searchParams);
  const filter = buildRestaurantMongoFilter(p);
  const coords = hasCoords(p) ? { lat: p.lat, lng: p.lng } : null;

  // Pull a candidate set, then order it. For ranking we over-fetch a little so
  // the score — not just proximity — decides the final top results.
  const candidateLimit = p.sort === "rank" ? Math.min(p.limit * 2, 100) : p.limit;

  const query = coords
    ? Restaurant.find({ ...filter, ...nearbyFilter(coords.lng, coords.lat, p.radius) })
    : Restaurant.find(filter).sort({ rating: -1, ratingCount: -1 });

  const candidates = (await query.limit(candidateLimit).lean()) as GeoRestaurant[];

  if (p.sort === "rank") {
    const distanceOf = coords
      ? (r: GeoRestaurant) =>
          r.location?.coordinates
            ? haversineMeters(
                { lng: r.location.coordinates[0], lat: r.location.coordinates[1] },
                coords
              )
            : undefined
      : undefined;
    return ok(rankRestaurants(candidates, distanceOf).slice(0, p.limit));
  }

  return ok(candidates.slice(0, p.limit));
});
