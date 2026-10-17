"use client";

import React, { useEffect, useState } from "react";
import MealCard from "@/components/MealCard";
import {
  searchRestaurants,
  type RankedRestaurant,
  type SearchParams,
} from "@/lib/discoveryClient";

type Sort = NonNullable<SearchParams["sort"]>;

const LandingDiscovery: React.FC = () => {
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [maxPrice, setMaxPrice] = useState(0);
  const [openNow, setOpenNow] = useState(false);
  const [sort, setSort] = useState<Sort>("rank");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [results, setResults] = useState<RankedRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const restaurants = await searchRestaurants({
          q: q.trim() || undefined,
          cuisine: cuisine.trim() || undefined,
          maxPrice: maxPrice || undefined,
          openNow,
          sort,
          lat: coords?.lat,
          lng: coords?.lng,
          limit: 4,
        });
        if (!cancelled) {
          setResults(restaurants);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load restaurants");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [q, cuisine, maxPrice, openNow, sort, coords]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Location is not available in this browser.");
      return;
    }

    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords: position }) => {
        setCoords({ lat: position.latitude, lng: position.longitude });
        setSort("distance");
        setLocating(false);
      },
      (geoError) => {
        setLocationError(geoError.message || "Could not get your location.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const priceLabel = (restaurant: RankedRestaurant) =>
    restaurant.isOpen === false
      ? "Closed"
      : restaurant.deliveryFee
        ? `GHS ${restaurant.deliveryFee} delivery`
        : "Free delivery";

  return (
    <section className="container py-12" aria-labelledby="landing-discovery-title">
      <div className="mb-6">
        <h2 id="landing-discovery-title" className="section-title">
          Find food near you
        </h2>
        <p className="mt-1 text-muted">
          Search restaurants and narrow your picks to match your appetite.
        </p>
      </div>

      <div className="card mb-6 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <label className="text-sm lg:col-span-2">
          <span className="text-muted">Search</span>
          <input
            className="input"
            type="search"
            placeholder="Restaurant or dish"
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="text-muted">Cuisine</span>
          <input
            className="input"
            type="search"
            placeholder="e.g. local"
            value={cuisine}
            onChange={(event) => setCuisine(event.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="text-muted">Max price</span>
          <select
            className="input"
            value={maxPrice}
            onChange={(event) => setMaxPrice(Number(event.target.value))}
          >
            <option value={0}>Any price</option>
            <option value={1}>₵</option>
            <option value={2}>₵₵</option>
            <option value={3}>₵₵₵</option>
            <option value={4}>₵₵₵₵</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="text-muted">Sort by</span>
          <select
            className="input"
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
          >
            <option value="rank">Best match</option>
            <option value="rating">Top rated</option>
            <option value="distance" disabled={!coords}>
              Nearest
            </option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm lg:col-span-2">
          <input
            type="checkbox"
            checked={openNow}
            onChange={(event) => setOpenNow(event.target.checked)}
          />
          Open and accepting orders
        </label>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-4">
          <button
            className="btn-outline w-fit"
            type="button"
            onClick={useMyLocation}
            disabled={locating}
          >
            {locating ? "Finding your location…" : coords ? "Update my location" : "Use my location"}
          </button>
          {coords && <span className="text-sm text-muted">Showing nearby restaurants</span>}
          {locationError && (
            <p role="alert" className="text-sm text-red-600">
              {locationError}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-red-600">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-muted" aria-live="polite">
          Finding restaurants…
        </p>
      ) : results.length === 0 ? (
        <p className="text-muted">No restaurants match those filters.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((restaurant) => (
            <MealCard
              key={restaurant._id}
              img={restaurant.imageUrl ?? "/istockphoto-1277719283-612x612.jpg"}
              title={restaurant.name}
              desc={restaurant.cuisines?.[0] ?? restaurant.category ?? "Restaurant"}
              rating={restaurant.rating ?? 0}
              price={priceLabel(restaurant)}
              id={restaurant.externalId || restaurant._id}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default LandingDiscovery;
