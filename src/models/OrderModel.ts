import mongoose, { Model, Document } from "mongoose";
import mongodbConnect from "@/utils/mongoConnect";

interface IProduct {
  id: string;
  name: string;
  image: string;
  price: number;
}

interface IOrder extends Document {
  id: string;
  name: string;
  products: IProduct[];
  price: number;
  order_date: Date;
}

const OrderProductSchema = new mongoose.Schema<IProduct>({
  id: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

const OrderSchema = new mongoose.Schema<IOrder>(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    products: {
      type: [OrderProductSchema],
      required: true,
    },
    order_date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

let Order: Model<IOrder>;

const initializeModel = async (): Promise<Model<IOrder> | null> => {
  const conn = await mongodbConnect();
  if (conn) {
    Order = conn.models.Order || conn.model<IOrder>("Order", OrderSchema);
    return Order;
  } else {
    console.error("Failed to connect to database");
    return null;
  }
};

export const getOrderModel = async (): Promise<Model<IOrder> | null> => {
  if (!Order) {
    await initializeModel();
  }
  return Order;
};
