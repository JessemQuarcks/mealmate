/**
 * Browser helpers for discovery: ranked/filtered restaurant search and the
 * signed-in user's recommendations.
 */

export interface RankedRestaurant {
  _id: string;
  externalId: string;
  name: string;
  category?: string;
  cuisines?: string[];
  rating?: number;
  ratingCount?: number;
  imageUrl?: string;
  deliveryFee?: number;
  prepTimeMinutes?: number;
  isOpen?: boolean;
  acceptingOrders?: boolean;
  promotion?: { label?: string; percentOff?: number; active?: boolean };
  _score?: number;
}

export interface SearchParams {
  q?: string;
  cuisine?: string;
  maxPrice?: number;
  openNow?: boolean;
  sort?: "rank" | "distance" | "rating";
  lat?: number;
  lng?: number;
  limit?: number;
}

export interface Recommendations {
  reorder: { restaurant_id: string; restaurant_name?: string }[];
  trending: { restaurant_id: string; restaurant_name?: string; orders: number }[];
}

async function unwrap<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new Error(body?.errors?.join(", ") || `Request failed (${res.status})`);
  }
  return body.data as T;
}

export async function searchRestaurants(params: SearchParams): Promise<RankedRestaurant[]> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.cuisine) sp.set("cuisine", params.cuisine);
  if (params.maxPrice) sp.set("maxPrice", String(params.maxPrice));
  if (params.openNow) sp.set("openNow", "true");
  if (params.sort) sp.set("sort", params.sort);
  if (params.lat !== undefined) sp.set("lat", String(params.lat));
  if (params.lng !== undefined) sp.set("lng", String(params.lng));
  if (params.limit) sp.set("limit", String(params.limit));
  return unwrap<RankedRestaurant[]>(await fetch(`/api/restaurants?${sp.toString()}`, { cache: "no-store" }));
}

/** Returns null when the user isn't signed in (recommendations are personal). */
export async function getRecommendations(): Promise<Recommendations | null> {
  try {
    return await unwrap<Recommendations>(await fetch("/api/recommendations", { cache: "no-store" }));
  } catch {
    return null;
  }
}
