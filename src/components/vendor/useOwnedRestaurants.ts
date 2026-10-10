"use client";
import { useEffect, useState } from "react";

export interface OwnedRestaurant {
  _id: string;
  name: string;
  category?: string;
  isOpen: boolean;
  acceptingOrders: boolean;
  prepTimeMinutes: number;
  deliveryFee: number;
  promotion?: { label?: string; percentOff: number; active: boolean };
  menu: MenuItem[];
}

export interface MenuItem {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  discountPercent?: number;
  image?: string;
  available?: boolean;
}

/** Fetch the vendor's restaurants and track which one is selected. */
export function useOwnedRestaurants() {
  const [restaurants, setRestaurants] = useState<OwnedRestaurant[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vendor/restaurants");
      const body = await res.json();
      if (!res.ok) throw new Error(body?.errors?.join(", ") || "Failed to load");
      setRestaurants(body.data);
      setSelectedId((prev) => prev || body.data[0]?._id || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = restaurants.find((r) => r._id === selectedId);
  return { restaurants, selected, selectedId, setSelectedId, loading, error, reload };
}
