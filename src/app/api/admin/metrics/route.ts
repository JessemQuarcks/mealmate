import { getUserModel } from "@/models/user";
import { getRestaurantModel } from "@/models/restaurant";
import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, ok, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

function tally(rows: { _id: string; n: number }[]): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, r) => {
    if (r._id) acc[r._id] = r.n;
    return acc;
  }, {});
}

/** Operational snapshot for the admin overview dashboard. */
export const GET = withErrorHandling(async () => {
  const { response } = await requireRole("admin");
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const User = await getUserModel();
  const Restaurant = await getRestaurantModel();
  if (!User || !Restaurant) return fail("Database is not available", 503);

  const since7 = new Date(Date.now() - 7 * DAY);
  const since30 = new Date(Date.now() - 30 * DAY);

  const [
    usersByRole,
    usersByStatus,
    ordersByStatus,
    money,
    last7,
    last30,
    openDisputes,
    activeRestaurants,
    hiddenRestaurants,
  ] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", n: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Order.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { "payment.status": "paid" } },
      {
        $group: {
          _id: null,
          gmv: { $sum: "$total_amount" },
          revenue: { $sum: "$service_fee" },
          paid: { $sum: 1 },
        },
      },
    ]),
    Order.countDocuments({ createdAt: { $gte: since7 } }),
    Order.countDocuments({ createdAt: { $gte: since30 } }),
    Order.countDocuments({ "dispute.status": "open" }),
    Restaurant.countDocuments({ status: "active" }),
    Restaurant.countDocuments({ status: "hidden" }),
  ]);

  const byStatus = tally(usersByStatus);
  const m = money[0] ?? { gmv: 0, revenue: 0, paid: 0 };

  return ok({
    users: {
      total: Object.values(tally(usersByRole)).reduce((a, b) => a + b, 0),
      pending: byStatus.pending ?? 0,
      suspended: byStatus.suspended ?? 0,
      byRole: tally(usersByRole),
    },
    orders: {
      byStatus: tally(ordersByStatus),
      last7,
      last30,
      openDisputes,
      paid: m.paid,
    },
    money: {
      gmv: Math.round((m.gmv ?? 0) * 100) / 100,
      platformRevenue: Math.round((m.revenue ?? 0) * 100) / 100,
      currency: "GHS",
    },
    restaurants: { active: activeRestaurants, hidden: hiddenRestaurants },
  });
});
