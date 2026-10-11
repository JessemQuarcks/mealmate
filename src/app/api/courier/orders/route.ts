import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, ok, withErrorHandling } from "@/lib/http";
import { requireActiveCourier } from "@/lib/courier";

export const dynamic = "force-dynamic";

/**
 * The courier's dispatch feed:
 *  - `available`: paid orders a restaurant marked `ready` that no courier has
 *     claimed yet.
 *  - `active`: orders assigned to this courier that are not yet delivered.
 */
export const GET = withErrorHandling(async () => {
  const { user, response } = await requireActiveCourier();
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const [available, active] = await Promise.all([
    Order.find({
      status: "ready",
      "courier.user_id": { $exists: false },
      "payment.status": "paid",
    })
      .sort({ createdAt: 1 })
      .limit(50)
      .lean(),
    Order.find({
      "courier.user_id": user.id,
      status: { $in: ["ready", "out_for_delivery"] },
    })
      .sort({ createdAt: 1 })
      .lean(),
  ]);

  return ok({ available, active });
});
