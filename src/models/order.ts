import mongoose, { Model, Document } from "mongoose";
import mongodbConnect from "@/utils/mongoConnect";

interface IProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface IOrder extends Document {
  restaurant_id: string;
  restaurant_name: string;
  products: IProduct[];
  total_amount: number;
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
  quantity: {
    type: Number,
    required: true
  }
});

const OrderSchema = new mongoose.Schema<IOrder>(
  {
    products: {
      type: [OrderProductSchema], 
      required: true,
    },
    order_date: {
      type: Date,
      default: Date.now,
    },
    total_amount: {
      type: Number,
      required: true
    },
    restaurant_id:{
      type:String,
      required: true,
    },
    restaurant_name:{
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

export default Order;

// const initializeModel = async (): Promise<Model<IOrder> | null> => {
//   const conn = await mongodbConnect();
//   if (conn) {
//     Order = conn.models.Order || conn.model<IOrder>("Order", OrderSchema);
//     return Order;
//   } else {
//     console.error("Failed to connect to database");
//     return null;
//   }
// };

// export const getOrderModel = async (): Promise<Model<IOrder> | null> => {
//   if (!Order) {
//     await initializeModel();
//   }
//   return Order;
// };
