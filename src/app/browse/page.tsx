"use client";
import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import MealCard from "@/components/MealCard";
import {
  searchRestaurants,
  getRecommendations,
  RankedRestaurant,
  Recommendations,
  SearchParams,
} from "@/lib/discoveryClient";

type Sort = NonNullable<SearchParams["sort"]>;

const BrowseComponent: React.FC = () => {
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [maxPrice, setMaxPrice] = useState(0);
  const [openNow, setOpenNow] = useState(false);
  const [sort, setSort] = useState<Sort>("rank");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [results, setResults] = useState<RankedRestaurant[]>([]);
  const [recs, setRecs] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const data = await searchRestaurants({
        q: q || undefined,
        cuisine: cuisine || undefined,
        maxPrice: maxPrice || undefined,
        openNow,
        sort,
        lat: coords?.lat,
        lng: coords?.lng,
        limit: 24,
      });
      setResults(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load restaurants");
    } finally {
      setLoading(false);
    }
  }, [q, cuisine, maxPrice, openNow, sort, coords]);

  // Debounce so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(fetchResults, 300);
    return () => clearTimeout(t);
  }, [fetchResults]);

  useEffect(() => {
    getRecommendations().then(setRecs);
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) =>
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    );
  };

  const priceLabel = (r: RankedRestaurant) =>
    r.isOpen === false
      ? "Closed"
      : r.deliveryFee
      ? `GHS ${r.deliveryFee} delivery`
      : "Free delivery";

  return (
    <div className="container my-8">
      <h1 className="section-title mb-1">Browse restaurants</h1>
      <p className="text-muted mb-6">Ranked by rating, speed, price, offers and distance.</p>

      {/* Recommendations */}
      {recs && (recs.reorder.length > 0 || recs.trending.length > 0) && (
        <div className="mb-8 space-y-4">
          {recs.reorder.length > 0 && (
            <Rail title="Order again" items={recs.reorder} />
          )}
          {recs.trending.length > 0 && (
            <Rail title="Trending now" items={recs.trending} />
          )}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end">
        <label className="lg:col-span-2 text-sm">
          <span className="text-muted">Search</span>
          <input
            className="input"
            placeholder="Name or cuisine…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="text-muted">Cuisine</span>
          <input
            className="input"
            placeholder="e.g. local"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="text-muted">Max price</span>
          <select
            className="input"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
          >
            <option value={0}>Any</option>
            <option value={1}>₵</option>
            <option value={2}>₵₵</option>
            <option value={3}>₵₵₵</option>
            <option value={4}>₵₵₵₵</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="text-muted">Sort</span>
          <select
            className="input"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
          >
            <option value="rank">Best match</option>
            <option value="rating">Top rated</option>
            <option value="distance">Nearest</option>
          </select>
        </label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} />
            Open now
          </label>
        </div>
        <button className="btn-outline lg:col-span-6 w-fit" onClick={useMyLocation}>
          {coords ? "📍 Using your location" : "Use my location"}
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-muted">Loading restaurants…</p>
      ) : results.length === 0 ? (
        <p className="text-muted">No restaurants match those filters.</p>
      ) : (
        <div className="grid grid-cols-1 place-items-center sm:place-items-start sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {results.map((r) => (
            <MealCard
              key={r._id}
              img={r.imageUrl ?? "/istockphoto-1277719283-612x612.jpg"}
              title={r.name}
              desc={r.cuisines?.[0] ?? r.category ?? "Restaurant"}
              rating={r.rating ?? 0}
              price={priceLabel(r)}
              id={r.externalId || r._id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Rail: React.FC<{
  title: string;
  items: { restaurant_id: string; restaurant_name?: string; orders?: number }[];
}> = ({ title, items }) => (
  <div>
    <h2 className="font-semibold text-blackish mb-2">{title}</h2>
    <div className="flex gap-3 overflow-x-auto pb-1">
      {items.map((it) => (
        <Link
          key={it.restaurant_id}
          href={`/meal/${it.restaurant_id}`}
          className="shrink-0 rounded-xl border border-line bg-surface px-4 py-3 text-sm transition-colors hover:border-brand"
        >
          <span className="font-medium">{it.restaurant_name || "Restaurant"}</span>
          {typeof it.orders === "number" && (
            <span className="ml-2 text-muted">{it.orders} orders</span>
          )}
        </Link>
      ))}
    </div>
  </div>
);

const Browse = dynamic(() => Promise.resolve(BrowseComponent), { ssr: false });
export default Browse;
