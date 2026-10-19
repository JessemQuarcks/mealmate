"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { FiNavigation, FiStar, FiMapPin } from "react-icons/fi";
import { useLocationSync } from "@/lib/useLocationSync";
import { haversineMeters, formatDistance } from "@/lib/delivery";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const FALLBACK = { lat: 6.673175, lng: -1.565423 };

interface NearbyRestaurant {
  _id: string;
  externalId: string;
  name: string;
  imageUrl?: string;
  rating?: number;
  category?: string;
  cuisines?: string[];
  deliveryFee?: number;
  isOpen?: boolean;
  location: { coordinates: [number, number] }; // [lng, lat]
}

const DiscoverComponent: React.FC = () => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [center, setCenter] = useState(FALLBACK);
  const [restaurants, setRestaurants] = useState<NearbyRestaurant[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const mapRef = useRef(center);
  mapRef.current = center;

  const fetchNearby = useCallback(async (c: { lat: number; lng: number }) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/restaurants?lat=${c.lat}&lng=${c.lng}&radius=50000&sort=distance&limit=40`,
        { cache: "no-store" }
      );
      const body = await res.json();
      setRestaurants(body?.data ?? []);
    } catch {
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Grab the user's location (and keep it fresh).
  useEffect(() => {
    if (!navigator.geolocation) {
      fetchNearby(FALLBACK);
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setCenter(c);
      },
      () => fetchNearby(FALLBACK),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [fetchNearby]);

  // Load nearby whenever the user's location changes.
  useEffect(() => {
    if (coords) fetchNearby(coords);
  }, [coords, fetchNearby]);

  // Trigger coverage ingestion once per new area, then refresh the list.
  useLocationSync(coords, (result) => {
    if (coords) fetchNearby(coords);
    if (result.scraped && result.ingested > 0) {
      setNote(`Found ${result.ingested} places near you`);
      setTimeout(() => setNote(null), 4000);
    }
  });

  const recenter = (r: NearbyRestaurant) => {
    const [lng, lat] = r.location.coordinates;
    setCenter({ lat, lng });
    setSelected(r._id);
  };

  const distanceLabel = (r: NearbyRestaurant) => {
    if (!coords) return null;
    const [lng, lat] = r.location.coordinates;
    return formatDistance(haversineMeters(coords, { lat, lng }));
  };

  return (
    <div className="container my-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="section-title">Restaurants near you</h1>
          <p className="text-muted">
            {coords ? "Live from your location." : "Allow location for places around you."}
          </p>
        </div>
        <button
          className="btn-outline"
          onClick={() =>
            navigator.geolocation?.getCurrentPosition((p) => {
              const c = { lat: p.coords.latitude, lng: p.coords.longitude };
              setCoords(c);
              setCenter(c);
            })
          }
        >
          <FiNavigation /> Use my location
        </button>
      </div>

      {note && (
        <div className="mb-4 rounded-xl border border-brand/40 bg-brand-soft/30 px-4 py-2 text-sm text-brand">
          {note}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        {/* Nearby list */}
        <aside className="order-2 max-h-[72vh] space-y-3 overflow-y-auto pr-1 lg:order-1">
          {loading && restaurants.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-2" />
            ))
          ) : restaurants.length === 0 ? (
            <p className="text-muted">No restaurants found nearby yet.</p>
          ) : (
            restaurants.map((r) => (
              <div
                key={r._id}
                onClick={() => recenter(r)}
                className={`flex cursor-pointer gap-3 rounded-2xl border p-3 transition-all ${
                  selected === r._id ? "border-brand shadow-glow-sm" : "border-line hover:border-brand/50"
                }`}
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  {r.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={r.imageUrl}
                      alt={r.name}
                      width={64}
                      height={64}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{r.name}</p>
                    {r.rating ? (
                      <span className="flex shrink-0 items-center gap-1 text-sm text-brand">
                        <FiStar /> {r.rating.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-sm text-muted">
                    {r.cuisines?.[0] ?? r.category ?? "Restaurant"}
                    {distanceLabel(r) ? ` · ${distanceLabel(r)}` : ""}
                  </p>
                  <Link
                    href={`/meal/${r.externalId || r._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 inline-block text-sm font-medium text-brand"
                  >
                    View menu →
                  </Link>
                </div>
              </div>
            ))
          )}
        </aside>

        {/* Map */}
        <div className="order-1 h-[52vh] overflow-hidden rounded-2xl border border-line lg:order-2 lg:h-[72vh]">
          {MAPS_KEY ? (
            <APIProvider apiKey={MAPS_KEY}>
              <Map
                mapId="6ad54b3b63d51297"
                defaultCenter={FALLBACK}
                defaultZoom={14}
                gestureHandling="greedy"
                disableDefaultUI
              >
                <MapController focus={center} />
                {restaurants.map((r) => {
                  const [lng, lat] = r.location.coordinates;
                  return (
                    <AdvancedMarker
                      key={r._id}
                      position={{ lat, lng }}
                      title={r.name}
                      onClick={() => setSelected(r._id)}
                    >
                      <span
                        className={`grid place-items-center rounded-full border-2 border-white shadow-md transition-transform ${
                          selected === r._id ? "h-9 w-9 scale-110 bg-brand" : "h-7 w-7 bg-brand-strong"
                        }`}
                      >
                        <FiMapPin className="text-black" size={14} />
                      </span>
                    </AdvancedMarker>
                  );
                })}
                {coords && (
                  <AdvancedMarker position={coords} title="You">
                    <span className="block h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-[0_0_0_6px_rgba(59,130,246,0.3)]" />
                  </AdvancedMarker>
                )}
              </Map>
            </APIProvider>
          ) : (
            <div className="grid h-full place-items-center p-6 text-center text-muted">
              Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show the map. The list still works.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** Pans the map whenever `focus` changes, while leaving manual panning free. */
const MapController: React.FC<{ focus: { lat: number; lng: number } }> = ({ focus }) => {
  const map = useMap();
  useEffect(() => {
    if (map) map.panTo(focus);
  }, [map, focus]);
  return null;
};

const Discover = DiscoverComponent;
export default Discover;
