import { z } from "zod";
import crypto from "node:crypto";
import { fail, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireActiveVendor, loadOwnedRestaurant } from "@/lib/vendor";

export const dynamic = "force-dynamic";

function idFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("restaurants") + 1] ?? "";
}

const menuItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  description: z.string().max(300).optional(),
  category: z.string().max(60).optional(),
  price: z.number().nonnegative(),
  discountPercent: z.number().min(0).max(100).optional(),
  image: z.string().optional(),
  available: z.boolean().optional(),
});

const menuSchema = z.object({ menu: z.array(menuItemSchema) });

/**
 * Replace the full menu for an owned restaurant. The client edits the list
 * locally and saves the whole array; new items get a generated id.
 */
export const PUT = withErrorHandling(async (req) => {
  const { user, response } = await requireActiveVendor();
  if (response) return response;

  const { restaurant, response: ownErr } = await loadOwnedRestaurant(
    user,
    idFromUrl(req.url)
  );
  if (ownErr) return ownErr;

  const { data, error } = await parseBody(req, menuSchema);
  if (error) return error;

  restaurant.menu = data.menu.map((item) => ({
    id: item.id || crypto.randomUUID(),
    name: item.name,
    description: item.description,
    category: item.category,
    price: item.price,
    discountPercent: item.discountPercent,
    image: item.image,
    available: item.available ?? true,
  }));

  await restaurant.save();
  return ok(restaurant.menu);
});
