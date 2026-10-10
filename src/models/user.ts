import mongoose, { Document, Model } from "mongoose";
import mongodbConnect from "@/utils/mongoConnect";
import {
  ACCOUNT_STATUSES,
  AccountStatus,
  DEFAULT_ROLE,
  Role,
  ROLES,
} from "@/lib/roles";

export interface IAddress {
  label?: string;
  line1: string;
  line2?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

export interface IUser extends Document {
  name?: string;
  email: string;
  image?: string;
  phone?: string;
  /** bcrypt hash; absent for OAuth-only accounts. */
  passwordHash?: string;
  provider: "credentials" | "google";
  role: Role;
  status: AccountStatus;
  addresses: IAddress[];
}

const AddressSchema = new mongoose.Schema<IAddress>(
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

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: String,
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: String,
    phone: String,
    passwordHash: { type: String, select: false },
    provider: { type: String, enum: ["credentials", "google"], required: true },
    role: { type: String, enum: ROLES, default: DEFAULT_ROLE, required: true },
    status: { type: String, enum: ACCOUNT_STATUSES, default: "active", required: true },
    addresses: { type: [AddressSchema], default: [] },
  },
  { timestamps: true }
);

let User: Model<IUser>;

const initializeModel = async (): Promise<Model<IUser> | null> => {
  const conn = await mongodbConnect();
  if (!conn) {
    console.error("Failed to connect to database");
    return null;
  }
  User =
    (conn.models.User as Model<IUser>) || conn.model<IUser>("User", UserSchema);
  return User;
};

export const getUserModel = async (): Promise<Model<IUser> | null> => {
  if (!User) {
    await initializeModel();
  }
  return User;
};
