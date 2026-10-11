import mongoose, { Document, Model } from "mongoose";
import { ORDER_STATUSES, INITIAL_STATUS, OrderStatus } from "@/lib/orderStatus";
import {
  PAYMENT_STATUSES,
  INITIAL_PAYMENT_STATUS,
  PaymentStatus,
} from "@/lib/paymentStatus";

interface IOrderProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

/** Snapshot of the delivery address at the time of ordering. */
interface IDeliveryAddress {
  label?: string;
  line1: string;
  line2?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

/** Server-verified payment record for the order. */
interface IPayment {
  provider: "paystack";
  reference: string;
  status: PaymentStatus;
  /** Amount charged, in minor units (pesewas). */
  amountMinor: number;
  currency: string;
  verifiedAt?: Date;
}

/** Record of a refund issued against the order's payment. */
interface IRefund {
  /** Amount refunded, in minor units. */
  amountMinor: number;
  reference?: string;
  reason?: string;
  refundedAt: Date;
}

export interface IOrder extends Document {
  /** Owner of the order (the signed-in client). */
  user_id?: string;
  // Bound to a single vendor at checkout (Phase 4). Optional only on legacy
  // orders created before restaurant binding existed.
  restaurant_id?: string;
  restaurant_name?: string;
  products: IOrderProduct[];
  // --- Money breakdown (major units); see src/lib/fees.ts. ---
  subtotal?: number;
  delivery_fee?: number;
  service_fee?: number;
  tax?: number;
  tip?: number;
  /** Grand total actually charged (major units). */
  total_amount: number;
  currency: string;
  delivery_address?: IDeliveryAddress;
  payment?: IPayment;
  refund?: IRefund;
  cancelled_at?: Date;
  cancel_reason?: string;
  order_date: Date;
  status: OrderStatus;
}

const OrderProductSchema = new mongoose.Schema<IOrderProduct>({
  id: { type: String },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const DeliveryAddressSchema = new mongoose.Schema<IDeliveryAddress>(
  {
    label: String,
    line1: { type: String, required: true },
    line2: String,
    city: String,
    lat: Number,
    lng: Number,
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema<IPayment>(
  {
    provider: { type: String, enum: ["paystack"], required: true },
    reference: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: INITIAL_PAYMENT_STATUS,
      required: true,
    },
    amountMinor: { type: Number, required: true },
    currency: { type: String, required: true },
    verifiedAt: Date,
  },
  { _id: false }
);

const RefundSchema = new mongoose.Schema<IRefund>(
  {
    amountMinor: { type: Number, required: true },
    reference: String,
    reason: String,
    refundedAt: { type: Date, required: true },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema<IOrder>(
  {
    user_id: { type: String, index: true },
    products: { type: [OrderProductSchema], required: true },
    subtotal: { type: Number },
    delivery_fee: { type: Number, default: 0 },
    service_fee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    tip: { type: Number, default: 0 },
    order_date: { type: Date, default: Date.now },
    total_amount: { type: Number, required: true },
    currency: { type: String, default: "GHS", required: true },
    delivery_address: { type: DeliveryAddressSchema },
    payment: { type: PaymentSchema },
    refund: { type: RefundSchema },
    cancelled_at: { type: Date },
    cancel_reason: { type: String },
    restaurant_id: { type: String, index: true },
    restaurant_name: { type: String },
    status: { type: String, enum: ORDER_STATUSES, default: INITIAL_STATUS, index: true },
  },
  {
    timestamps: true,
  }
);

const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) ||
  mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
