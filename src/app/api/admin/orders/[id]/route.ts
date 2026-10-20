import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, ok, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

function idFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("orders") + 1] ?? "";
}

/** Full order detail for admins (any order). */
export const GET = withErrorHandling(async (req) => {
  const { response } = await requireRole("admin");
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const order = await Order.findById(idFromUrl(req.url)).lean();
  if (!order) return fail("Order not found", 404);

  return ok(order);
});
