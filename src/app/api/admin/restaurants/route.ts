import { getRestaurantModel } from "@/models/restaurant";
import { fail, ok, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

/** All restaurants (including hidden ones) for moderation, with text search. */
export const GET = withErrorHandling(async (req) => {
  const { response } = await requireRole("admin");
  if (response) return response;

  const Restaurant = await getRestaurantModel();
  if (!Restaurant) return fail("Database is not available", 503);

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const limit = Math.min(Number(url.searchParams.get("limit")) || 60, 200);

  const filter: Record<string, unknown> = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { address: { $regex: q, $options: "i" } },
    ];
  }

  const restaurants = await Restaurant.find(filter)
    .select("name status deliveryFee isOpen acceptingOrders promotion rating ratingCount ownerUserId externalId source")
    .sort({ status: 1, name: 1 })
    .limit(limit)
    .lean();

  return ok(restaurants);
});
