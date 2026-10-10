import mongodbConnect from "@/utils/mongoConnect";
import mongoose, { Model, Document } from "mongoose";

export interface IMenuItem {
  /** Stable id for cart/ordering; generated on create. */
  id: string;
  externalId?: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  /** 0–100 percentage discount; the effective price is computed in lib/pricing. */
  discountPercent?: number;
  image?: string;
  /** Sold-out toggle. */
  available: boolean;
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
  /** Set once a vendor claims the listing. */
  ownerUserId?: string;
  status: "active" | "hidden";
  // --- Vendor-controlled storefront signals (feed ranking in Phase 6) ---
  isOpen: boolean;
  acceptingOrders: boolean;
  prepTimeMinutes: number;
  deliveryFee: number;
  promotion?: { label?: string; percentOff: number; active: boolean };
}

const MenuItemSchema = new mongoose.Schema<IMenuItem>(
  {
    id: { type: String, required: true, default: () => crypto.randomUUID() },
    externalId: String,
    name: { type: String, required: true },
    description: String,
    category: String,
    price: { type: Number, required: true },
    discountPercent: { type: Number, min: 0, max: 100 },
    image: String,
    available: { type: Boolean, default: true },
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
    isOpen: { type: Boolean, default: true },
    acceptingOrders: { type: Boolean, default: true },
    prepTimeMinutes: { type: Number, default: 30 },
    deliveryFee: { type: Number, default: 0 },
    promotion: {
      label: String,
      percentOff: { type: Number, min: 0, max: 100, default: 0 },
      active: { type: Boolean, default: false },
    },
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
