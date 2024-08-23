import mongodbConnect from "@/utils/mongoConnect";
import mongoose, {Model, Document, } from "mongoose";

interface IRestaurants extends Document {
    id: number;
    name: string;
}

const restaurantsSchema = new mongoose.Schema<IRestaurants>(
    {
       id: {
        type: Number,
        required: [true, "Please add restaurant Id"]
       },

       name: {
        type: String,
       },
    },
    {
        timestamps: true,
    }
)

let Restaurants: Model<IRestaurants>;

const initializeModel = async (): Promise<Model<IRestaurants> | null> => {
  const conn = await mongodbConnect();
  if (conn) {
    Restaurants = conn.models.Products || conn.model<IRestaurants>("Restaurants", restaurantsSchema);
    return Restaurants;
  } else {
    console.error("Failed to connect to database");
    return null;
  }
};

export const getRestaurantsModel = async (): Promise<Model<IRestaurants> | null> => {
  if (!Restaurants) {
    await initializeModel();
  }
  return Restaurants;
};
