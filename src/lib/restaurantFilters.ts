/**
 * Parse and validate the discovery query string, and turn it into a MongoDB
 * filter. Kept pure (no DB) so the parsing and filter-building rules are unit
 * testable; the route layer adds geo and ranking on top.
 */
import { clampRadius, parseCoordParam } from "@/lib/geo";

export type SortMode = "rank" | "distance" | "rating";

export interface ParsedRestaurantQuery {
  q?: string;
  cuisine?: string;
  maxPriceLevel?: number;
  openNow: boolean;
  sort: SortMode;
  limit: number;
  radius: number;
  lat?: number;
  lng?: number;
}

function parseSort(value: string | null): SortMode {
  return value === "distance" || value === "rating" ? value : "rank";
}

export function parseRestaurantQuery(sp: URLSearchParams): ParsedRestaurantQuery {
  const maxPrice = Number(sp.get("maxPrice"));
  const rawLimit = Number(sp.get("limit"));
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(rawLimit, 100) : 50;
  return {
    q: sp.get("q")?.trim() || undefined,
    cuisine: sp.get("cuisine")?.trim() || undefined,
    maxPriceLevel: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : undefined,
    openNow: sp.get("openNow") === "true" || sp.get("openNow") === "1",
    sort: parseSort(sp.get("sort")),
    limit,
    radius: clampRadius(Number(sp.get("radius")) || undefined),
    lat: parseCoordParam(sp.get("lat")),
    lng: parseCoordParam(sp.get("lng")),
  };
}

/** Build the Mongo `find` filter (geo is layered on separately). */
export function buildRestaurantMongoFilter(p: ParsedRestaurantQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = { status: "active" };

  if (p.q) {
    filter.$or = [
      { name: { $regex: p.q, $options: "i" } },
      { category: { $regex: p.q, $options: "i" } },
      { cuisines: { $regex: p.q, $options: "i" } },
    ];
  }
  if (p.cuisine) {
    filter.cuisines = { $regex: p.cuisine, $options: "i" };
  }
  if (p.maxPriceLevel !== undefined) {
    filter.priceLevel = { $lte: p.maxPriceLevel };
  }
  if (p.openNow) {
    filter.isOpen = true;
    filter.acceptingOrders = true;
  }
  return filter;
}

/** Whether coordinates are present for a geo (`$near`) query. */
export function hasCoords(p: ParsedRestaurantQuery): p is ParsedRestaurantQuery & { lat: number; lng: number } {
  return p.lat !== undefined && p.lng !== undefined;
}
