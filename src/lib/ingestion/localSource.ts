import formattedData from "@/components/data";
import { cleanText, parseRating, parseRatingCount } from "./clean";
import type { IngestedRestaurant, RestaurantSource } from "./types";

/** The shape of each entry exported by the legacy data.ts seed file. */
export interface LocalRecord {
  id: number;
  name: string;
  google_map_url?: string;
  google_map_src?: string;
  ratings?: string;
  rating_by_person?: string;
  category?: string;
  coord?: { lat: number; lng: number };
  products?: Array<{ id: string; name: string; price: number; image: string }>;
}

/** Pure, testable normaliser from a legacy record to the ingestion shape. */
export function normalizeLocalRecord(record: LocalRecord): IngestedRestaurant {
  return {
    externalId: `local-${record.id}`,
    source: "local",
    name: cleanText(record.name),
    category: cleanText(record.category) || undefined,
    address: undefined,
    rating: parseRating(record.ratings),
    ratingCount: parseRatingCount(record.rating_by_person),
    imageUrl: record.google_map_src,
    mapUrl: record.google_map_url,
    coordinates: [record.coord?.lng ?? 0, record.coord?.lat ?? 0],
    menu: (record.products ?? []).map((p) => ({
      externalId: p.id,
      name: cleanText(p.name),
      price: p.price,
      image: p.image,
    })),
  };
}

export const localSource: RestaurantSource = {
  name: "local",
  async fetch() {
    return (formattedData as unknown as LocalRecord[])
      .map(normalizeLocalRecord)
      // Drop records without real coordinates — they can't be placed on the map.
      .filter((r) => r.coordinates[0] !== 0 && r.coordinates[1] !== 0);
  },
};
