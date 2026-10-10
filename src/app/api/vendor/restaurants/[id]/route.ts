import { z } from "zod";
import { fail, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireActiveVendor, loadOwnedRestaurant } from "@/lib/vendor";

export const dynamic = "force-dynamic";

function idFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("restaurants") + 1] ?? "";
}

const settingsSchema = z.object({
  isOpen: z.boolean().optional(),
  acceptingOrders: z.boolean().optional(),
  prepTimeMinutes: z.number().int().min(0).max(240).optional(),
  deliveryFee: z.number().min(0).optional(),
  promotion: z
    .object({
      label: z.string().max(80).optional(),
      percentOff: z.number().min(0).max(100),
      active: z.boolean(),
    })
    .optional(),
});

/** Update vendor-controlled storefront settings for an owned restaurant. */
export const PATCH = withErrorHandling(async (req) => {
  const { user, response } = await requireActiveVendor();
  if (response) return response;

  const { restaurant, response: ownErr } = await loadOwnedRestaurant(
    user,
    idFromUrl(req.url)
  );
  if (ownErr) return ownErr;

  const { data, error } = await parseBody(req, settingsSchema);
  if (error) return error;

  if (data.isOpen !== undefined) restaurant.isOpen = data.isOpen;
  if (data.acceptingOrders !== undefined) restaurant.acceptingOrders = data.acceptingOrders;
  if (data.prepTimeMinutes !== undefined) restaurant.prepTimeMinutes = data.prepTimeMinutes;
  if (data.deliveryFee !== undefined) restaurant.deliveryFee = data.deliveryFee;
  if (data.promotion !== undefined) restaurant.promotion = data.promotion;

  await restaurant.save();
  return ok(restaurant.toObject());
});
