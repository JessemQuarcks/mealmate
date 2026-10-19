import { useEffect, useRef } from "react";
import { haversineMeters } from "@/lib/delivery";

/** Only re-sync coverage once the user has moved this far (a "new area"). */
const SYNC_THRESHOLD_METERS = 2500;

export interface SyncResult {
  nearbyCount: number;
  reason: string;
  scraped: boolean;
  seeded: boolean;
  ingested: number;
}

/**
 * Ensure restaurant coverage for the user's location, firing once per area:
 * when `coords` first arrives and again only after they move beyond the
 * threshold. Calls POST /api/discovery/sync (which itself dedupes and cools
 * down server-side) and invokes `onSynced` when coverage may have changed.
 */
export function useLocationSync(
  coords: { lat: number; lng: number } | null | undefined,
  onSynced?: (result: SyncResult) => void
) {
  const last = useRef<{ lat: number; lng: number } | null>(null);
  const inflight = useRef(false);
  const cb = useRef(onSynced);
  cb.current = onSynced;

  useEffect(() => {
    if (!coords) return;
    const prev = last.current;
    const movedEnough = !prev || haversineMeters(prev, coords) > SYNC_THRESHOLD_METERS;
    if (!movedEnough || inflight.current) return;

    inflight.current = true;
    last.current = coords;

    fetch("/api/discovery/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coords),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (body?.success) cb.current?.(body.data as SyncResult);
      })
      .catch(() => {
        /* coverage is best-effort; the seed still backs discovery */
      })
      .finally(() => {
        inflight.current = false;
      });
  }, [coords]);
}
