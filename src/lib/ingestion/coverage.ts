/**
 * Coverage logic for location-driven ingestion. When a user's location moves
 * into a new area we want to scrape nearby restaurants *once* — not on every
 * GPS jitter and not if the area is already covered. This module decides, from
 * cheap inputs (a nearby-count and the last-ingest time for the area's grid
 * cell), whether a fresh ingestion is warranted. Pure and tested.
 */

/** ~0.045° ≈ 5 km grid; one ingestion per cell, with a cooldown. */
export const CELL_DEGREES = 0.045;
/** Enough nearby restaurants that we needn't scrape again. */
export const MIN_COVERAGE = 6;
/** Don't re-scrape the same cell more often than this. */
export const COOLDOWN_MS = 6 * 60 * 60 * 1000;
/** Radius used both for the coverage count and the Google scrape. */
export const COVERAGE_RADIUS_METERS = 5000;

/** A stable key for the grid cell a coordinate falls in. */
export function cellKey(lat: number, lng: number): string {
  return `${Math.round(lat / CELL_DEGREES)}:${Math.round(lng / CELL_DEGREES)}`;
}

export interface IngestDecisionInput {
  nearbyCount: number;
  lastIngestedAt?: Date | null;
  now?: number;
  hasKey: boolean;
}

export type IngestReason = "no-key" | "covered" | "cooldown" | "sparse";

/** Decide whether to run a live ingestion for an area. */
export function decideIngestion(input: IngestDecisionInput): { ingest: boolean; reason: IngestReason } {
  const now = input.now ?? Date.now();
  if (!input.hasKey) return { ingest: false, reason: "no-key" };
  if (input.nearbyCount >= MIN_COVERAGE) return { ingest: false, reason: "covered" };
  if (input.lastIngestedAt && now - input.lastIngestedAt.getTime() < COOLDOWN_MS) {
    return { ingest: false, reason: "cooldown" };
  }
  return { ingest: true, reason: "sparse" };
}
