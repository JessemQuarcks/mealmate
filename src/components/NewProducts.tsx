"use client";
import React, { useEffect, useState } from "react";
import MealCard from "./MealCard";

interface Restaurant {
  _id: string;
  externalId: string;
  name: string;
  category?: string;
  rating?: number;
  imageUrl?: string;
}

const NewProducts = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/restaurants?limit=10")
      .then((r) => r.json())
      .then((body) => setRestaurants(body?.data ?? []))
      .catch((err) => console.log("Failed to load restaurants", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative flex flex-col m-5 bg-white p-10">
      <h2 className="font-large text-2xl text-center pb-10 pl-10 sm:pl-5">
        <b>HOT OFFERS</b>
      </h2>

      {loading ? (
        <p className="text-center text-gray-500">Loading restaurants…</p>
      ) : restaurants.length === 0 ? (
        <p className="text-center text-gray-500">
          No restaurants yet. Seed the database from the admin console.
        </p>
      ) : (
        <div className="grid grid-cols-1 place-items-center sm:place-items-start sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5 sm:mb-20">
          {restaurants.map((item) => (
            <MealCard
              key={item._id}
              img={item.imageUrl ?? "/istockphoto-1277719283-612x612.jpg"}
              title={item.name}
              desc={item.category ?? "Restaurant"}
              rating={item.rating ?? 0}
              price={"Nearby"}
              id={item.externalId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NewProducts;
