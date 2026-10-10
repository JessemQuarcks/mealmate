import { cleanText } from "./clean";
import type { IngestedRestaurant, RestaurantSource } from "./types";

/**
 * Google Places (Nearby Search) source. Requires GOOGLE_PLACES_API_KEY and,
 * per Google's terms, place data may only be cached/stored within the limits of
 * the Places API policy — review that before enabling scheduled refresh in prod.
 *
 * Without a key this source throws a clear error so misconfiguration is obvious
 * rather than silently returning nothing.
 */
const PLACES_URL =
  "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

interface GooglePlace {
  place_id: string;
  name: string;
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  geometry?: { location?: { lat: number; lng: number } };
  photos?: Array<{ photo_reference: string }>;
}

function photoUrl(ref: string, key: string): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${ref}&key=${key}`;
}

export function normalizeGooglePlace(place: GooglePlace, key: string): IngestedRestaurant {
  return {
    externalId: place.place_id,
    source: "google",
    name: cleanText(place.name),
    category: place.types?.[0]?.replace(/_/g, " "),
    cuisines: place.types,
    address: cleanText(place.vicinity),
    rating: place.rating,
    ratingCount: place.user_ratings_total ?? 0,
    priceLevel: place.price_level,
    imageUrl: place.photos?.[0]
      ? photoUrl(place.photos[0].photo_reference, key)
      : undefined,
    coordinates: [
      place.geometry?.location?.lng ?? 0,
      place.geometry?.location?.lat ?? 0,
    ],
    menu: [],
  };
}

export const googleSource: RestaurantSource = {
  name: "google",
  async fetch(options) {
    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) {
      throw new Error(
        "GOOGLE_PLACES_API_KEY is not set — cannot ingest from Google Places"
      );
    }
    if (!options?.near) {
      throw new Error("Google Places ingestion requires a `near` location");
    }

    const { lat, lng, radiusMeters = 5000 } = options.near;
    const url = `${PLACES_URL}?location=${lat},${lng}&radius=${radiusMeters}&type=restaurant&key=${key}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Google Places request failed: ${res.status}`);
    }
    const body = (await res.json()) as { results?: GooglePlace[]; status?: string };
    if (body.status && body.status !== "OK" && body.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places error: ${body.status}`);
    }

    return (body.results ?? [])
      .map((p) => normalizeGooglePlace(p, key))
      .filter((r) => r.coordinates[0] !== 0 && r.coordinates[1] !== 0);
  },
};
