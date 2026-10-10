import { z } from "zod";
import { fail, ok, parseBody, withErrorHandling } from "@/lib/http";
import { getSessionUser } from "@/lib/session";
import { hasRole } from "@/lib/roles";
import { ingestFrom } from "@/lib/ingestion/ingest";

export const dynamic = "force-dynamic";

const ingestSchema = z.object({
  source: z.enum(["local", "google"]).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radiusMeters: z.number().positive().optional(),
});

/**
 * Trigger an ingestion run. Authorised either by an admin session (manual run
 * from the console) or an `Authorization: Bearer <INGEST_SECRET>` header, so a
 * scheduled job (cron / GitHub Action) can refresh data without a login.
 */
export const POST = withErrorHandling(async (req) => {
  const secret = process.env.INGEST_SECRET;
  const authHeader = req.headers.get("authorization");
  const viaSecret = !!secret && authHeader === `Bearer ${secret}`;

  if (!viaSecret) {
    const user = await getSessionUser();
    if (!user || !hasRole(user.role, "admin")) {
      return fail("Authentication required", 401);
    }
  }

  const { data, error } = await parseBody(req, ingestSchema);
  if (error) return error;

  const source = data.source ?? "local";
  const near =
    data.lat !== undefined && data.lng !== undefined
      ? { lat: data.lat, lng: data.lng, radiusMeters: data.radiusMeters }
      : undefined;

  if (source === "google" && !near) {
    return fail("Google ingestion needs lat and lng", 422);
  }

  const result = await ingestFrom(source, near ? { near } : undefined);
  return ok(result);
});
