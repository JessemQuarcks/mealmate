"use client";
import React, { useEffect, useState } from "react";
import MealCard from "@/components/MealCard";
import Reveal from "@/components/landing/Reveal";
import { searchRestaurants, RankedRestaurant } from "@/lib/discoveryClient";

/** Live "top picks" grid, ranked by the discovery engine. */
const FeaturedRestaurants: React.FC = () => {
  const [items, setItems] = useState<RankedRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    searchRestaurants({ sort: "rank", limit: 8 })
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const priceLabel = (r: RankedRestaurant) =>
    r.isOpen === false ? "Closed" : r.deliveryFee ? `GHS ${r.deliveryFee}` : "Free delivery";

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-muted">
        No restaurants yet — seed the database from the admin console to see live picks.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      {items.map((r, i) => (
        <Reveal key={r._id} delay={i * 70}>
          <MealCard
            img={r.imageUrl ?? "/istockphoto-1277719283-612x612.jpg"}
            title={r.name}
            desc={r.cuisines?.[0] ?? r.category ?? "Restaurant"}
            rating={r.rating ?? 0}
            price={priceLabel(r)}
            id={r.externalId || r._id}
          />
        </Reveal>
      ))}
    </div>
  );
};

export default FeaturedRestaurants;
