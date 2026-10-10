import { getRestaurantModel } from "@/models/restaurant";
import { logger } from "@/lib/http";
import { slugify } from "./clean";
import { localSource } from "./localSource";
import { googleSource } from "./googleSource";
import type { RestaurantSource } from "./types";

export interface IngestResult {
  source: string;
  fetched: number;
  upserted: number;
  errors: number;
}

const SOURCES: Record<string, RestaurantSource> = {
  local: localSource,
  google: googleSource,
};

/**
 * Run a source and upsert its restaurants, deduped by `externalId`. Re-running
 * is idempotent: existing records are refreshed, new ones inserted. This is the
 * entry point a scheduled refresh (cron) calls.
 */
export async function ingestFrom(
  sourceName: string,
  options?: { near?: { lat: number; lng: number; radiusMeters?: number } }
): Promise<IngestResult> {
  const source = SOURCES[sourceName];
  if (!source) {
    throw new Error(`Unknown ingestion source: ${sourceName}`);
  }

  const Restaurant = await getRestaurantModel();
  if (!Restaurant) {
    throw new Error("Database is not available");
  }

  const records = await source.fetch(options);
  let upserted = 0;
  let errors = 0;

  for (const r of records) {
    try {
      await Restaurant.updateOne(
        { externalId: r.externalId },
        {
          $set: {
            source: r.source,
            name: r.name,
            slug: slugify(r.name),
            category: r.category,
            cuisines: r.cuisines ?? [],
            address: r.address,
            phone: r.phone,
            rating: r.rating,
            ratingCount: r.ratingCount ?? 0,
            priceLevel: r.priceLevel,
            imageUrl: r.imageUrl,
            mapUrl: r.mapUrl,
            openingStatus: r.openingStatus,
            services: {
              dineIn: r.services?.dineIn ?? false,
              driveThrough: r.services?.driveThrough ?? false,
              delivery: r.services?.delivery ?? false,
            },
            location: { type: "Point", coordinates: r.coordinates },
            menu: r.menu ?? [],
          },
        },
        { upsert: true }
      );
      upserted++;
    } catch (err) {
      errors++;
      logger.error("Ingest upsert failed", { externalId: r.externalId, err });
    }
  }

  const result: IngestResult = {
    source: sourceName,
    fetched: records.length,
    upserted,
    errors,
  };
  logger.info("Ingestion complete", result);
  return result;
}
