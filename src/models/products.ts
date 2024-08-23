import mongoose, { Model, Document } from "mongoose";
import mongodbConnect from "@/utils/mongoConnect";

interface IProduct {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface IProducts extends Document {
  id: number;
  products: IProduct[];
}

const ProductSchema = new mongoose.Schema<IProduct>({
  id: {
    type: String,
  },
  name: {
    type: String,
  },
  price: {
    type: Number,
  },
  image: {
    type: String,
  },
});

const ProductsSchema = new mongoose.Schema<IProducts>(
  {
    id: {
      type: Number,
    },
    products: {
      type: [ProductSchema],
    },
  },
  {
    timestamps: true,
  }
);

let Products: Model<IProducts>;

const initializeModel = async (): Promise<Model<IProducts> | null> => {
  const conn = await mongodbConnect();
  if (conn) {
    Products = conn.models.Products || conn.model<IProducts>("Products", ProductsSchema);
    return Products;
  } else {
    console.error("Failed to connect to database");
    return null;
  }
};

export const getProductsModel = async (): Promise<Model<IProducts> | null> => {
  if (!Products) {
    await initializeModel();
  }
  return Products;
};
