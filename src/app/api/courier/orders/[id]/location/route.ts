import { z } from "zod";
import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireActiveCourier } from "@/lib/courier";

export const dynamic = "force-dynamic";

function orderIdFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("orders") + 1] ?? "";
}

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * Report the courier's current position. The browser (or courier app) pings
 * this every few seconds while a delivery is active; the customer's tracking
 * screen polls the order to see it move. Stored as a GeoJSON point ([lng, lat])
 * with a freshness timestamp. Only the assigned courier of an active order may
 * post, and the conditional update enforces both in one atomic write.
 */
export const POST = withErrorHandling(async (req) => {
  const { user, response } = await requireActiveCourier();
  if (response) return response;

  const { data, error } = await parseBody(req, locationSchema);
  if (error) return error;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const updated = await Order.findOneAndUpdate(
    {
      _id: orderIdFromUrl(req.url),
      "courier.user_id": user.id,
      status: { $in: ["ready", "out_for_delivery"] },
    },
    {
      $set: {
        courier_location: {
          type: "Point",
          coordinates: [data.lng, data.lat],
          updatedAt: new Date(),
        },
      },
    },
    { new: true, projection: { courier_location: 1, status: 1 } }
  ).lean();

  if (!updated) {
    return fail("No active delivery assigned to you for this order", 409);
  }
  return ok({ courier_location: updated.courier_location, status: updated.status });
});
