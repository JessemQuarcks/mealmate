import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, ok, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

const TRENDING_WINDOW_DAYS = 30;

interface RecentOrder {
  restaurant_id?: string;
  restaurant_name?: string;
}

/**
 * Personalised discovery for the signed-in user:
 *  - `reorder`: distinct restaurants from their recent orders, newest first.
 *  - `trending`: the most-ordered restaurants across everyone in the last
 *     {@link TRENDING_WINDOW_DAYS} days.
 */
export const GET = withErrorHandling(async () => {
  const { user, response } = await requireRole();
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const recent = (await Order.find({ user_id: user.id, restaurant_id: { $exists: true } })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()) as unknown as RecentOrder[];

  const seen = new Set<string>();
  const reorder: { restaurant_id: string; restaurant_name?: string }[] = [];
  for (const o of recent) {
    if (!o.restaurant_id || seen.has(o.restaurant_id)) continue;
    seen.add(o.restaurant_id);
    reorder.push({ restaurant_id: o.restaurant_id, restaurant_name: o.restaurant_name });
    if (reorder.length >= 5) break;
  }

  const since = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const trendingAgg = await Order.aggregate([
    { $match: { restaurant_id: { $exists: true }, createdAt: { $gte: since } } },
    { $group: { _id: "$restaurant_id", name: { $first: "$restaurant_name" }, orders: { $sum: 1 } } },
    { $sort: { orders: -1 } },
    { $limit: 5 },
  ]);

  const trending = trendingAgg.map((t: { _id: string; name?: string; orders: number }) => ({
    restaurant_id: t._id,
    restaurant_name: t.name,
    orders: t.orders,
  }));

  return ok({ reorder, trending });
});
