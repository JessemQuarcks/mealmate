"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  CourierFeed,
  CourierOrder,
  getCourierOrders,
  claimOrder,
  setDeliveryStatus,
  pingLocation,
} from "@/lib/courierClient";

const POLL_MS = 10_000;

const CourierConsole: React.FC = () => {
  const [feed, setFeed] = useState<CourierFeed>({ available: [], active: [] });
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      setFeed(await getCourierOrders());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load orders");
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  // Share location: ping every active out-for-delivery order as the position changes.
  const onDeliveringRef = useRef<CourierOrder[]>([]);
  onDeliveringRef.current = feed.active.filter((o) => o.status === "out_for_delivery");

  useEffect(() => {
    if (!sharing) {
      if (watchId.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }
    if (!navigator.geolocation) {
      setError("This device can't share location.");
      setSharing(false);
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onDeliveringRef.current.forEach((o) => pingLocation(o._id, coords));
      },
      () => setError("Location permission denied."),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => {
      if (watchId.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [sharing]);

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const addr = (o: CourierOrder) =>
    o.delivery_address ? [o.delivery_address.line1, o.delivery_address.city].filter(Boolean).join(", ") : "—";

  return (
    <div className="space-y-8">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title text-xl">Your active deliveries</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sharing}
              onChange={(e) => setSharing(e.target.checked)}
            />
            Share my location
          </label>
        </div>
        {feed.active.length === 0 ? (
          <p className="text-gray-500 text-sm">No active deliveries. Claim one below.</p>
        ) : (
          <ul className="space-y-3">
            {feed.active.map((o) => (
              <li key={o._id} className="card flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{o.restaurant_name || "Order"}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="text-sm text-gray-600">Deliver to: {addr(o)}</p>
                </div>
                <div className="flex gap-2">
                  {o.status === "ready" && (
                    <button
                      className="btn-primary"
                      disabled={busy === o._id}
                      onClick={() => run(o._id, () => setDeliveryStatus(o._id, "out_for_delivery"))}
                    >
                      Picked up
                    </button>
                  )}
                  {o.status === "out_for_delivery" && (
                    <button
                      className="btn-dark"
                      disabled={busy === o._id}
                      onClick={() => run(o._id, () => setDeliveryStatus(o._id, "delivered"))}
                    >
                      Mark delivered
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="section-title text-xl mb-3">Available pickups</h2>
        {feed.available.length === 0 ? (
          <p className="text-gray-500 text-sm">Nothing ready to pick up right now.</p>
        ) : (
          <ul className="space-y-3">
            {feed.available.map((o) => (
              <li key={o._id} className="card flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{o.restaurant_name || "Order"}</div>
                  <p className="text-sm text-gray-600">
                    {o.products.length} item{o.products.length === 1 ? "" : "s"} · to {addr(o)}
                  </p>
                </div>
                <button
                  className="btn-outline"
                  disabled={busy === o._id}
                  onClick={() => run(o._id, () => claimOrder(o._id))}
                >
                  Claim
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default CourierConsole;
