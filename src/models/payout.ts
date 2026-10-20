import mongoose, { Document, Model } from "mongoose";

/**
 * A recorded vendor payout. The admin settles what a vendor is owed (food +
 * tips on delivered, paid, non-refunded orders) and logs it here, so the
 * owed-summary can subtract already-paid amounts.
 */
export interface IPayout extends Document {
  vendorUserId: string;
  restaurantId?: string;
  amount: number;
  orderCount: number;
  currency: string;
  status: "paid";
  paidAt: Date;
  note?: string;
  createdBy: string;
}

const PayoutSchema = new mongoose.Schema<IPayout>(
  {
    vendorUserId: { type: String, required: true, index: true },
    restaurantId: { type: String },
    amount: { type: Number, required: true },
    orderCount: { type: Number, default: 0 },
    currency: { type: String, default: "GHS" },
    status: { type: String, enum: ["paid"], default: "paid" },
    paidAt: { type: Date, required: true },
    note: { type: String },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

const Payout: Model<IPayout> =
  (mongoose.models.Payout as Model<IPayout>) ||
  mongoose.model<IPayout>("Payout", PayoutSchema);

export default Payout;
