import { getRestaurantModel } from "@/models/restaurant";
import { fail, ok, withErrorHandling } from "@/lib/http";
import { clampRadius, nearbyFilter, parseCoordParam } from "@/lib/geo";

export const dynamic = "force-dynamic";

/**
 * Search restaurants. With `lat`/`lng` the results come back nearest-first via a
 * 2dsphere `$near` query; without coordinates it falls back to top-rated. `q`
 * filters by name/category text, and `radius` (metres) bounds the search.
 */
export const GET = withErrorHandling(async (req) => {
  const Restaurant = await getRestaurantModel();
  if (!Restaurant) return fail("Database is not available", 503);

  const url = new URL(req.url);
  const lat = parseCoordParam(url.searchParams.get("lat"));
  const lng = parseCoordParam(url.searchParams.get("lng"));
  const q = url.searchParams.get("q")?.trim();
  const radius = clampRadius(Number(url.searchParams.get("radius")) || undefined);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);

  const filter: Record<string, unknown> = { status: "active" };
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
    ];
  }

  let query;
  if (lat !== undefined && lng !== undefined) {
    // $near already returns results sorted by distance.
    query = Restaurant.find({ ...filter, ...nearbyFilter(lng, lat, radius) });
  } else {
    query = Restaurant.find(filter).sort({ rating: -1, ratingCount: -1 });
  }

  const restaurants = await query.limit(limit).lean();
  return ok(restaurants);
});
