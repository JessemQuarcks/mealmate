import mongoose, { Document, Model } from "mongoose";

/**
 * Platform-wide settings, stored as a single document (`key: "platform"`).
 * Admin-editable; read by checkout so fees aren't hardcoded.
 */
export interface ISettings extends Document {
  key: string;
  serviceFeePercent: number;
  taxPercent: number;
  currency: string;
}

const SettingsSchema = new mongoose.Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true, default: "platform" },
    serviceFeePercent: { type: Number, default: 5, min: 0, max: 100 },
    taxPercent: { type: Number, default: 0, min: 0, max: 100 },
    currency: { type: String, default: "GHS" },
  },
  { timestamps: true }
);

const Settings: Model<ISettings> =
  (mongoose.models.Settings as Model<ISettings>) ||
  mongoose.model<ISettings>("Settings", SettingsSchema);

export default Settings;
