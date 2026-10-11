import { z } from "zod";
import Cart from "@/models/cart";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

const cartItemSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().int().positive(),
});

const putCartSchema = z.object({
  restaurant_id: z.string().min(1),
  items: z.array(cartItemSchema),
});

/** The signed-in user's current cart. */
export const GET = withErrorHandling(async () => {
  const { user, response } = await requireRole();
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const cart = await Cart.findOne({ user_id: user.id }).lean();
  return ok(cart ?? { user_id: user.id, restaurant_id: null, items: [] });
});

/**
 * Replace the cart wholesale. A cart belongs to one restaurant, so the client
 * sends the restaurant id and the full item list; switching restaurants simply
 * replaces what was there.
 */
export const PUT = withErrorHandling(async (req) => {
  const { user, response } = await requireRole();
  if (response) return response;

  const { data, error } = await parseBody(req, putCartSchema);
  if (error) return error;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const cart = await Cart.findOneAndUpdate(
    { user_id: user.id },
    { user_id: user.id, restaurant_id: data.restaurant_id, items: data.items },
    { new: true, upsert: true }
  ).lean();

  logger.info("Cart replaced", { user: user.id, items: data.items.length });
  return ok(cart);
});

/** Empty the cart. */
export const DELETE = withErrorHandling(async () => {
  const { user, response } = await requireRole();
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  await Cart.findOneAndUpdate(
    { user_id: user.id },
    { restaurant_id: undefined, items: [] },
    { upsert: true }
  );
  return ok({ cleared: true });
});
