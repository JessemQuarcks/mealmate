import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, ok, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { buildTrackPayload, TrackableOrder } from "@/lib/trackPayload";

export const dynamic = "force-dynamic";

function orderIdFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("orders") + 1] ?? "";
}

/**
 * Live tracking snapshot for the order's owner: current status, event timeline,
 * courier position and a derived distance + ETA. The payload is built by the
 * shared helper, so this and the SSE stream never drift apart. The customer
 * screen uses the SSE stream when available and falls back to polling this.
 */
export const GET = withErrorHandling(async (req) => {
  const { user, response } = await requireRole();
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const order = await Order.findOne({ _id: orderIdFromUrl(req.url), user_id: user.id }).lean();
  if (!order) return fail("Order not found", 404);

  return ok(buildTrackPayload(order as unknown as TrackableOrder));
});
