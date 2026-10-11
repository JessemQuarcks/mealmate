import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, ok, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

function idFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("orders") + 1] ?? "";
}

/** A single order, readable only by the user who placed it. */
export const GET = withErrorHandling(async (req) => {
  const { user, response } = await requireRole();
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const order = await Order.findOne({
    _id: idFromUrl(req.url),
    user_id: user.id,
  }).lean();
  if (!order) return fail("Order not found", 404);

  return ok(order);
});
