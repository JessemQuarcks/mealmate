import mongodbConnect from "@/utils/mongoConnect";
import mongoose, { Model, Document } from "mongoose";

export interface IMenuItem {
  externalId?: string;
  name: string;
  price: number;
  image?: string;
}

export interface IRestaurant extends Document {
  externalId: string;
  source: "local" | "google";
  name: string;
  slug?: string;
  category?: string;
  cuisines: string[];
  address?: string;
  phone?: string;
  rating?: number;
  ratingCount: number;
  priceLevel?: number;
  imageUrl?: string;
  mapUrl?: string;
  openingStatus?: string;
  services: { dineIn: boolean; driveThrough: boolean; delivery: boolean };
  /** GeoJSON Point: coordinates are [longitude, latitude]. */
  location: { type: "Point"; coordinates: [number, number] };
  menu: IMenuItem[];
  /** Set once a vendor claims the listing (Phase 3). */
  ownerUserId?: string;
  status: "active" | "hidden";
}

const MenuItemSchema = new mongoose.Schema<IMenuItem>(
  {
    externalId: String,
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: String,
  },
  { _id: false }
);

const RestaurantSchema = new mongoose.Schema<IRestaurant>(
  {
    externalId: { type: String, required: true, unique: true, index: true },
    source: { type: String, enum: ["local", "google"], required: true },
    name: { type: String, required: true },
    slug: String,
    category: String,
    cuisines: { type: [String], default: [] },
    address: String,
    phone: String,
    rating: Number,
    ratingCount: { type: Number, default: 0 },
    priceLevel: Number,
    imageUrl: String,
    mapUrl: String,
    openingStatus: String,
    services: {
      dineIn: { type: Boolean, default: false },
      driveThrough: { type: Boolean, default: false },
      delivery: { type: Boolean, default: false },
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    menu: { type: [MenuItemSchema], default: [] },
    ownerUserId: { type: String, index: true },
    status: { type: String, enum: ["active", "hidden"], default: "active" },
  },
  { timestamps: true }
);

// 2dsphere index powers $near / $geoNear proximity queries.
RestaurantSchema.index({ location: "2dsphere" });
// Text index backs the simple name/category search.
RestaurantSchema.index({ name: "text", category: "text" });

let Restaurant: Model<IRestaurant>;

const initializeModel = async (): Promise<Model<IRestaurant> | null> => {
  const conn = await mongodbConnect();
  if (!conn) {
    console.error("Failed to connect to database");
    return null;
  }
  Restaurant =
    (conn.models.Restaurant as Model<IRestaurant>) ||
    conn.model<IRestaurant>("Restaurant", RestaurantSchema);
  return Restaurant;
};

export const getRestaurantModel = async (): Promise<Model<IRestaurant> | null> => {
  if (!Restaurant) {
    await initializeModel();
  }
  return Restaurant;
};
