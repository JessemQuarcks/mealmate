import { z } from "zod";
import Order from "@/models/order";
import Payout from "@/models/payout";
import { getRestaurantModel } from "@/models/restaurant";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { computeVendorPayouts, PayableOrder } from "@/lib/payouts";

export const dynamic = "force-dynamic";

/**
 * Owed-per-vendor summary (food + tips on paid, delivered, un-refunded orders)
 * net of amounts already recorded in the payout ledger, plus the recent ledger.
 */
export const GET = withErrorHandling(async () => {
  const { response } = await requireRole("admin");
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const Restaurant = await getRestaurantModel();
  if (!Restaurant) return fail("Database is not available", 503);

  const orders = (await Order.find({
    status: "delivered",
    "payment.status": "paid",
    refund: { $exists: false },
  })
    .select("restaurant_id restaurant_name subtotal tip status payment.status")
    .lean()) as unknown as PayableOrder[];

  // Map restaurant -> owner so earnings attribute to the vendor account.
  const restaurantIds = Array.from(
    new Set(orders.map((o) => o.restaurant_id).filter(Boolean) as string[])
  );
  const restaurants = await Restaurant.find({ _id: { $in: restaurantIds } })
    .select("ownerUserId")
    .lean();
  const ownerMap = new Map(restaurants.map((r) => [String(r._id), r.ownerUserId]));

  const rows = computeVendorPayouts(orders, (rid) => ownerMap.get(rid));

  // Collapse per vendor and subtract already-paid ledger totals.
  const byVendor = new Map<string, { vendorUserId: string; restaurantName?: string; gross: number; orderCount: number }>();
  for (const r of rows) {
    const cur = byVendor.get(r.vendorUserId) ?? {
      vendorUserId: r.vendorUserId,
      restaurantName: r.restaurantName,
      gross: 0,
      orderCount: 0,
    };
    cur.gross = Math.round((cur.gross + r.owed) * 100) / 100;
    cur.orderCount += r.orderCount;
    byVendor.set(r.vendorUserId, cur);
  }

  const paidAgg = await Payout.aggregate([
    { $group: { _id: "$vendorUserId", paid: { $sum: "$amount" } } },
  ]);
  const paidMap = new Map(paidAgg.map((p: { _id: string; paid: number }) => [p._id, p.paid]));

  const summary = Array.from(byVendor.values())
    .map((v) => {
      const paid = paidMap.get(v.vendorUserId) ?? 0;
      return { ...v, paid: Math.round(paid * 100) / 100, net: Math.round((v.gross - paid) * 100) / 100 };
    })
    .sort((a, b) => b.net - a.net);

  const ledger = await Payout.find({}).sort({ paidAt: -1 }).limit(20).lean();

  return ok({ summary, ledger });
});

const payoutSchema = z.object({
  vendorUserId: z.string().min(1),
  restaurantId: z.string().optional(),
  amount: z.number().positive(),
  orderCount: z.number().int().nonnegative().optional(),
  note: z.string().max(280).optional(),
});

/** Record a vendor payout as settled. */
export const POST = withErrorHandling(async (req) => {
  const { user, response } = await requireRole("admin");
  if (response) return response;

  const { data, error } = await parseBody(req, payoutSchema);
  if (error) return error;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const payout = await Payout.create({
    vendorUserId: data.vendorUserId,
    restaurantId: data.restaurantId,
    amount: data.amount,
    orderCount: data.orderCount ?? 0,
    status: "paid",
    paidAt: new Date(),
    note: data.note,
    createdBy: user.id,
  });

  logger.info("Payout recorded", { by: user.id, vendor: data.vendorUserId, amount: data.amount });
  return ok(payout.toObject(), 201);
});
