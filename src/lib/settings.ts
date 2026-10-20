import Settings from "@/models/settings";
import mongodbConnect from "@/utils/mongoConnect";

export interface PlatformSettings {
  serviceFeePercent: number;
  taxPercent: number;
  currency: string;
}

/** Safe defaults if the DB is unavailable or no settings doc exists yet. */
export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  serviceFeePercent: 5,
  taxPercent: 0,
  currency: "GHS",
};

/** Read the platform settings singleton, falling back to defaults. */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  const conn = await mongodbConnect();
  if (!conn) return DEFAULT_PLATFORM_SETTINGS;

  const doc = await Settings.findOne({ key: "platform" }).lean();
  if (!doc) return DEFAULT_PLATFORM_SETTINGS;

  return {
    serviceFeePercent: doc.serviceFeePercent ?? DEFAULT_PLATFORM_SETTINGS.serviceFeePercent,
    taxPercent: doc.taxPercent ?? DEFAULT_PLATFORM_SETTINGS.taxPercent,
    currency: doc.currency ?? DEFAULT_PLATFORM_SETTINGS.currency,
  };
}
