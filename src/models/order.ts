import mongoose, { Document, Model } from "mongoose";
import { ORDER_STATUSES, INITIAL_STATUS, OrderStatus } from "@/lib/orderStatus";

interface IOrderProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  /** Owner of the order (the signed-in client). */
  user_id?: string;
  // TODO(P2/P4): the cart is not restaurant-scoped yet, so these are optional.
  // Make them required once orders are bound to a single vendor.
  restaurant_id?: string;
  restaurant_name?: string;
  products: IOrderProduct[];
  total_amount: number;
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

const OrderSchema = new mongoose.Schema<IOrder>(
  {
    user_id: { type: String, index: true },
    products: { type: [OrderProductSchema], required: true },
    order_date: { type: Date, default: Date.now },
    total_amount: { type: Number, required: true },
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
