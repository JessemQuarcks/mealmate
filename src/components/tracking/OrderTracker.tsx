"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import StatusBadge from "@/components/ui/StatusBadge";
import { describeEvent } from "@/lib/orderEvents";

interface TrackEvent {
  type: string;
  at: string;
  note?: string;
}

interface TrackData {
  status: string;
  events: TrackEvent[];
  courier: { name: string } | null;
  courier_location: { lat: number; lng: number; updatedAt: string | null } | null;
  destination: { lat: number; lng: number } | null;
  proof_of_delivery: { note?: string; photoUrl?: string; deliveredAt: string } | null;
  distance_meters: number | null;
  eta_minutes: number | null;
}

const POLL_MS = 7_000;
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const OrderTracker: React.FC<{ orderId: string }> = ({ orderId }) => {
  const [data, setData] = useState<TrackData | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Latest status without re-subscribing the stream each render.
  const statusRef = useRef<string | null>(null);
  statusRef.current = data?.status ?? null;

  const isTerminal = (s: string | null) =>
    s === "delivered" || s === "cancelled" || s === "rejected";

  // Fallback polling (used only when SSE is unavailable or drops mid-delivery).
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/track`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.errors?.join(", ") || "Failed");
      setData(body.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load tracking");
    }
  }, [orderId]);

  // Prefer the SSE push stream; fall back to polling if it's unsupported or errors.
  useEffect(() => {
    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (pollTimer) return;
      refresh();
      pollTimer = setInterval(refresh, POLL_MS);
    };

    if (typeof window !== "undefined" && "EventSource" in window) {
      es = new EventSource(`/api/orders/${orderId}/track/stream`);
      es.onmessage = (e) => {
        try {
          setData(JSON.parse(e.data));
          setError(null);
        } catch {
          /* ignore malformed frame */
        }
      };
      es.addEventListener("notfound", () => {
        setError("Order not found");
        es?.close();
      });
      es.onerror = () => {
        es?.close();
        es = null;
        // A clean close after delivery is expected; only poll if still in flight.
        if (!isTerminal(statusRef.current)) startPolling();
      };
    } else {
      startPolling();
    }

    return () => {
      es?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [orderId, refresh]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-muted">Loading tracking…</p>;

  const delivered = data.status === "delivered";
  const showMap = Boolean(MAPS_KEY && data.courier_location && data.destination);

  return (
    <div className="space-y-6">
      <div className="card flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Order status</p>
          <StatusBadge status={data.status} className="mt-1 text-sm" />
        </div>
        {!delivered && data.eta_minutes != null && (
          <div className="text-right">
            <p className="text-sm text-muted">Estimated arrival</p>
            <p className="text-2xl font-bold text-accent">~{data.eta_minutes} min</p>
          </div>
        )}
      </div>

      {showMap && (
        <div className="h-72 w-full overflow-hidden rounded-xl border">
          <APIProvider apiKey={MAPS_KEY!}>
            <Map
              mapId="6ad54b3b63d51297"
              defaultCenter={data.courier_location!}
              defaultZoom={14}
              gestureHandling="greedy"
              disableDefaultUI
            >
              <AdvancedMarker position={data.courier_location!} title={data.courier?.name ?? "Courier"}>
                <span className="text-2xl">🛵</span>
              </AdvancedMarker>
              <AdvancedMarker position={data.destination!} title="Delivery address">
                <span className="text-2xl">📍</span>
              </AdvancedMarker>
            </Map>
          </APIProvider>
        </div>
      )}

      {data.courier && (
        <p className="text-sm text-muted">
          Courier: <b>{data.courier.name}</b>
          {data.distance_meters != null && !delivered && (
            <> · {(data.distance_meters / 1000).toFixed(1)} km away</>
          )}
        </p>
      )}

      <div className="card">
        <h2 className="font-semibold mb-3">Timeline</h2>
        <ol className="space-y-3">
          {[...data.events].reverse().map((e, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
              <div>
                <p className="text-sm font-medium">{describeEvent(e.type)}</p>
                {e.note && <p className="text-xs text-muted">{e.note}</p>}
                <p className="text-xs text-muted">{new Date(e.at).toLocaleString()}</p>
              </div>
            </li>
          ))}
          {data.events.length === 0 && <li className="text-sm text-muted">No updates yet.</li>}
        </ol>
      </div>

      {delivered && (
        <RatingForm orderId={orderId} alreadyProof={data.proof_of_delivery} onRated={refresh} />
      )}
    </div>
  );
};

const RatingForm: React.FC<{
  orderId: string;
  alreadyProof: TrackData["proof_of_delivery"];
  onRated: () => void;
}> = ({ orderId, alreadyProof, onRated }) => {
  const [courier, setCourier] = useState(0);
  const [restaurant, setRestaurant] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courier: courier || undefined,
          restaurant: restaurant || undefined,
          comment: comment || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.errors?.join(", ") || "Failed");
      setDone(true);
      onRated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit rating");
    }
  };

  const Stars = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
    <div className="flex gap-1 text-2xl text-[#FF9529]">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" aria-label={`${n} star`} onClick={() => onChange(n)}>
          {n <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );

  return (
    <div className="card space-y-4">
      {alreadyProof && (
        <p className="text-sm text-green-700">
          Delivered {new Date(alreadyProof.deliveredAt).toLocaleString()}
          {alreadyProof.note ? ` — "${alreadyProof.note}"` : ""}
        </p>
      )}
      {done ? (
        <p className="text-sm text-green-700">Thanks for your feedback! 🙏</p>
      ) : (
        <>
          <h2 className="font-semibold">Rate your order</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm">Courier</span>
            <Stars value={courier} onChange={setCourier} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Restaurant</span>
            <Stars value={restaurant} onChange={setRestaurant} />
          </div>
          <textarea
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Leave a comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            className="btn-primary"
            disabled={!courier && !restaurant}
            onClick={submit}
          >
            Submit rating
          </button>
        </>
      )}
    </div>
  );
};

export default OrderTracker;
