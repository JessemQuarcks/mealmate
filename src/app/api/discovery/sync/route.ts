import { z } from "zod";
import { getRestaurantModel } from "@/models/restaurant";
import CoverageCell from "@/models/coverageCell";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { ingestFrom } from "@/lib/ingestion/ingest";
import {
  cellKey,
  decideIngestion,
  COVERAGE_RADIUS_METERS,
} from "@/lib/ingestion/coverage";

export const dynamic = "force-dynamic";

const EARTH_RADIUS_METERS = 6_378_137;

const syncSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * Ensure restaurant coverage around a point. Called by the discovery UI when
 * the user's location moves into a new area. If the area is sparse and a Google
 * Places key is configured, it scrapes once (deduped per grid cell, with a
 * cooldown) so results are genuinely nearby. The local seed stays as a fallback
 * so a page is never empty. Signed-in users only, to protect the scrape quota.
 */
export const POST = withErrorHandling(async (req) => {
  const { response } = await requireRole();
  if (response) return response;

  const { data, error } = await parseBody(req, syncSchema);
  if (error) return error;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const Restaurant = await getRestaurantModel();
  if (!Restaurant) return fail("Database is not available", 503);

  const { lat, lng } = data;

  // Cheap coverage count within the radius (works inside countDocuments).
  const nearbyCount = await Restaurant.countDocuments({
    status: "active",
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], COVERAGE_RADIUS_METERS / EARTH_RADIUS_METERS],
      },
    },
  });

  const key = cellKey(lat, lng);
  const existing = await CoverageCell.findOne({ cell: key }).lean();
  const decision = decideIngestion({
    nearbyCount,
    lastIngestedAt: existing?.lastIngestedAt ?? null,
    hasKey: !!process.env.GOOGLE_PLACES_API_KEY,
  });

  let ingested = 0;
  let scraped = false;

  if (decision.ingest) {
    try {
      const result = await ingestFrom("google", {
        near: { lat, lng, radiusMeters: COVERAGE_RADIUS_METERS },
      });
      ingested = result.upserted;
      scraped = true;
      await CoverageCell.findOneAndUpdate(
        { cell: key },
        { cell: key, lat, lng, lastIngestedAt: new Date(), restaurantsFound: ingested },
        { upsert: true }
      );
    } catch (err) {
      logger.error("Location ingestion failed; falling back to seed", err);
    }
  }

  // Last-resort fallback: if the database is still completely empty, seed the
  // local dataset so discovery is never a blank page.
  const total = await Restaurant.estimatedDocumentCount();
  let seeded = false;
  if (total === 0) {
    try {
      const seed = await ingestFrom("local");
      ingested += seed.upserted;
      seeded = true;
    } catch (err) {
      logger.error("Local seed fallback failed", err);
    }
  }

  return ok({
    nearbyCount,
    reason: decision.reason,
    scraped,
    seeded,
    ingested,
  });
});
