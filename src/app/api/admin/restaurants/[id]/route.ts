import { z } from "zod";
import { getRestaurantModel } from "@/models/restaurant";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

function idFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("restaurants") + 1] ?? "";
}

const patchSchema = z.object({
  status: z.enum(["active", "hidden"]).optional(),
  deliveryFee: z.number().min(0).optional(),
  promotion: z
    .object({
      label: z.string().max(60).optional(),
      percentOff: z.number().min(0).max(100).optional(),
      active: z.boolean().optional(),
    })
    .optional(),
});

/** Moderate a restaurant: hide/unhide, or override delivery fee / promotion. */
export const PATCH = withErrorHandling(async (req) => {
  const { user, response } = await requireRole("admin");
  if (response) return response;

  const { data, error } = await parseBody(req, patchSchema);
  if (error) return error;

  const Restaurant = await getRestaurantModel();
  if (!Restaurant) return fail("Database is not available", 503);

  const update: Record<string, unknown> = {};
  if (data.status) update.status = data.status;
  if (data.deliveryFee !== undefined) update.deliveryFee = data.deliveryFee;
  if (data.promotion) update.promotion = data.promotion;

  if (Object.keys(update).length === 0) {
    return fail("Nothing to update", 422);
  }

  const updated = await Restaurant.findByIdAndUpdate(idFromUrl(req.url), update, { new: true })
    .select("name status deliveryFee promotion")
    .lean();
  if (!updated) return fail("Restaurant not found", 404);

  logger.info("Admin moderated restaurant", { by: user.id, id: idFromUrl(req.url), update });
  return ok(updated);
});
