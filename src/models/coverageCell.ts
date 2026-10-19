import mongoose, { Document, Model } from "mongoose";

/**
 * A grid cell we've already run location-driven ingestion for. Lets the sync
 * endpoint cooldown repeated scrapes of the same area (see lib/ingestion/coverage).
 */
export interface ICoverageCell extends Document {
  cell: string;
  lat: number;
  lng: number;
  lastIngestedAt: Date;
  restaurantsFound: number;
}

const CoverageCellSchema = new mongoose.Schema<ICoverageCell>(
  {
    cell: { type: String, required: true, unique: true, index: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    lastIngestedAt: { type: Date, required: true },
    restaurantsFound: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const CoverageCell: Model<ICoverageCell> =
  (mongoose.models.CoverageCell as Model<ICoverageCell>) ||
  mongoose.model<ICoverageCell>("CoverageCell", CoverageCellSchema);

export default CoverageCell;
