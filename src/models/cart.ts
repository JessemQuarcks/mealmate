import mongoose, { Document, Model } from "mongoose";

/**
 * Server-synced cart. The browser keeps a local cart for responsiveness, but
 * the authoritative cart lives here so it survives device changes and so
 * checkout can price it against the live menu. A cart is bound to exactly one
 * restaurant; adding an item from another restaurant replaces the cart.
 */
interface ICartItem {
  id: string;
  quantity: number;
}

export interface ICart extends Document {
  user_id: string;
  restaurant_id?: string;
  items: ICartItem[];
}

const CartItemSchema = new mongoose.Schema<ICartItem>(
  {
    id: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const CartSchema = new mongoose.Schema<ICart>(
  {
    // One cart per user.
    user_id: { type: String, required: true, unique: true, index: true },
    restaurant_id: { type: String },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true }
);

const Cart: Model<ICart> =
  (mongoose.models.Cart as Model<ICart>) ||
  mongoose.model<ICart>("Cart", CartSchema);

export default Cart;
