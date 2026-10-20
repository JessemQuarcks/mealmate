import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, ok, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { splitPending, DEFAULT_STALE_MS, ReconcilableOrder } from "@/lib/reconciliation";

export const dynamic = "force-dynamic";

/**
 * Payment reconciliation snapshot: counts by payment status, plus the pending
 * orders old enough to warrant an admin re-verify (money that may be collected
 * at Paystack but not yet confirmed here).
 */
export const GET = withErrorHandling(async () => {
  const { response } = await requireRole("admin");
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const [byStatusRows, pending] = await Promise.all([
    Order.aggregate([{ $group: { _id: "$payment.status", n: { $sum: 1 } } }]),
    Order.find({ "payment.status": "pending" })
      .select("createdAt payment.status payment.reference payment.amountMinor total_amount restaurant_name")
      .sort({ createdAt: 1 })
      .limit(100)
      .lean(),
  ]);

  const byStatus = byStatusRows.reduce<Record<string, number>>((acc, r) => {
    if (r._id) acc[r._id] = r.n;
    return acc;
  }, {});

  const { stale } = splitPending(pending as unknown as ReconcilableOrder[]);

  return ok({
    byStatus,
    staleAfterMinutes: Math.round(DEFAULT_STALE_MS / 60000),
    stalePending: stale,
    pendingTotal: pending.length,
  });
});
