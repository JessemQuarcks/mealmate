import { z } from "zod";
import Settings from "@/models/settings";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { getPlatformSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Current platform fee settings. */
export const GET = withErrorHandling(async () => {
  const { response } = await requireRole("admin");
  if (response) return response;
  return ok(await getPlatformSettings());
});

const patchSchema = z.object({
  serviceFeePercent: z.number().min(0).max(100).optional(),
  taxPercent: z.number().min(0).max(100).optional(),
  currency: z.string().min(1).max(8).optional(),
});

/** Update platform fees (service fee %, tax %, currency). */
export const PATCH = withErrorHandling(async (req) => {
  const { user, response } = await requireRole("admin");
  if (response) return response;

  const { data, error } = await parseBody(req, patchSchema);
  if (error) return error;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const update: Record<string, unknown> = { key: "platform" };
  if (data.serviceFeePercent !== undefined) update.serviceFeePercent = data.serviceFeePercent;
  if (data.taxPercent !== undefined) update.taxPercent = data.taxPercent;
  if (data.currency !== undefined) update.currency = data.currency;

  await Settings.findOneAndUpdate({ key: "platform" }, update, { upsert: true, new: true });
  logger.info("Platform settings updated", { by: user.id, update });

  return ok(await getPlatformSettings());
});
