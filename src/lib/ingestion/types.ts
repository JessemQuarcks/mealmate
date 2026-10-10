/** A single menu item as produced by ingestion (full CRUD arrives in Phase 3). */
export interface IngestedMenuItem {
  externalId: string;
  name: string;
  price: number;
  image?: string;
}

/**
 * The normalized shape every source must emit. Keeping ingestion sources behind
 * this interface means the rest of the app never depends on where a restaurant
 * came from (local seed file today, Google Places / a licensed feed tomorrow).
 */
export interface IngestedRestaurant {
  /** Stable id within the source; used to dedupe on re-ingest. */
  externalId: string;
  source: "local" | "google";
  name: string;
  category?: string;
  cuisines?: string[];
  address?: string;
  phone?: string;
  rating?: number;
  ratingCount?: number;
  priceLevel?: number;
  imageUrl?: string;
  mapUrl?: string;
  openingStatus?: string;
  services?: {
    dineIn?: boolean;
    driveThrough?: boolean;
    delivery?: boolean;
  };
  /** [longitude, latitude] — GeoJSON order. */
  coordinates: [number, number];
  menu?: IngestedMenuItem[];
}

export interface RestaurantSource {
  readonly name: IngestedRestaurant["source"];
  /** Fetch and normalise restaurants. `near` is optional for geo-aware sources. */
  fetch(options?: {
    near?: { lat: number; lng: number; radiusMeters?: number };
  }): Promise<IngestedRestaurant[]>;
}
