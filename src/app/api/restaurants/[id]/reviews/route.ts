import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, ok, withErrorHandling } from "@/lib/http";

export const dynamic = "force-dynamic";

function restaurantIdFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("restaurants") + 1] ?? "";
}

interface RatedOrder {
  ratings?: { restaurant?: number; comment?: string; ratedAt?: string };
}

/**
 * Public reviews for a restaurant, derived from the restaurant rating customers
 * leave on their delivered orders. Returns the recent reviews plus an average
 * and count so the discovery UI can show social proof.
 */
export const GET = withErrorHandling(async (req) => {
  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const id = restaurantIdFromUrl(req.url);
  const orders = (await Order.find({
    restaurant_id: id,
    "ratings.restaurant": { $exists: true },
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()) as unknown as RatedOrder[];

  const scored = orders
    .map((o) => ({
      stars: o.ratings?.restaurant ?? 0,
      comment: o.ratings?.comment,
      at: o.ratings?.ratedAt ?? null,
    }))
    .filter((r) => r.stars > 0);

  const count = scored.length;
  const average =
    count > 0 ? Math.round((scored.reduce((s, r) => s + r.stars, 0) / count) * 10) / 10 : null;

  return ok({ average, count, reviews: scored.slice(0, 20) });
});
