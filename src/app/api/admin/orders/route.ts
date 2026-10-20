import mongoose from "mongoose";
import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, ok, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { ORDER_STATUSES } from "@/lib/orderStatus";
import { PAYMENT_STATUSES } from "@/lib/paymentStatus";

export const dynamic = "force-dynamic";

/** All orders for admins, with status / payment / dispute / text filters. */
export const GET = withErrorHandling(async (req) => {
  const { response } = await requireRole("admin");
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const payment = url.searchParams.get("payment");
  const dispute = url.searchParams.get("dispute");
  const q = url.searchParams.get("q")?.trim();
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);

  const filter: Record<string, unknown> = {};
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) filter.status = status;
  if (payment && (PAYMENT_STATUSES as readonly string[]).includes(payment)) {
    filter["payment.status"] = payment;
  }
  if (dispute === "open" || dispute === "resolved" || dispute === "rejected") {
    filter["dispute.status"] = dispute;
  }
  if (q) {
    const or: Record<string, unknown>[] = [{ restaurant_name: { $regex: q, $options: "i" } }];
    if (mongoose.Types.ObjectId.isValid(q)) or.push({ _id: q });
    filter.$or = or;
  }

  const orders = await Order.find(filter)
    .select("restaurant_name total_amount currency status payment.status dispute.status createdAt user_id")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return ok(orders);
});
