import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { z } from "zod";

const orderProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
});

const createOrderSchema = z.object({
  products: z.array(orderProductSchema).min(1, "An order needs at least one item"),
  total_amount: z.number().nonnegative(),
  restaurant_id: z.string().optional(),
  restaurant_name: z.string().optional(),
});

export const POST = withErrorHandling(async (req) => {
  const { user, response } = await requireRole();
  if (response) return response;

  // TODO(P4): verify the Paystack transaction server-side before persisting.
  const { data, error } = await parseBody(req, createOrderSchema);
  if (error) return error;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const saved = await Order.create({ ...data, user_id: user.id });
  logger.info("Order created", { id: saved._id, user: user.id, total: saved.total_amount });
  return ok(saved, 201);
});

export const GET = withErrorHandling(async () => {
  const { user, response } = await requireRole();
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  // Scoped to the signed-in user, so one user never sees another's orders.
  const orders = await Order.find({ user_id: user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return ok(orders);
});
