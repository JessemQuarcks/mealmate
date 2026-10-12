/**
 * Restaurant ranking. Discovery sorts restaurants by a single 0–1 score blended
 * from the real signals a hungry customer cares about: how well it's rated (and
 * how confidently), whether it's open and taking orders, how fast it cooks, how
 * cheap delivery is, any live discount, and how near it is. Pure and tested so
 * the weighting is easy to reason about and tune.
 */
import { MAX_RADIUS_METERS } from "@/lib/geo";

export interface RankSignals {
  rating?: number;
  ratingCount?: number;
  prepTimeMinutes?: number;
  deliveryFee?: number;
  isOpen?: boolean;
  acceptingOrders?: boolean;
  promotion?: { percentOff?: number; active?: boolean };
  menu?: { discountPercent?: number; available?: boolean }[];
  /** Metres from the user, when a location is known. */
  distanceMeters?: number;
}

export const RANK_WEIGHTS = {
  rating: 0.3,
  availability: 0.25,
  speed: 0.15,
  price: 0.1,
  discount: 0.1,
  distance: 0.1,
} as const;

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** Map a value in [from,to] to a 0–1 score; higher input → lower score. */
function inverseBand(value: number, from: number, to: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return clamp01(1 - (value - from) / (to - from));
}

function ratingScore(rating = 0, count = 0): number {
  // Confidence grows with the number of ratings, capped at 20.
  const confidence = clamp01(count / 20);
  const normalized = clamp01(rating / 5);
  // Blend toward a neutral 0.5 when there are few ratings.
  return normalized * confidence + 0.5 * (1 - confidence);
}

function discountScore(signals: RankSignals): number {
  const promo = signals.promotion?.active ? signals.promotion.percentOff ?? 0 : 0;
  const bestItem = (signals.menu ?? []).reduce(
    (max, m) => (m.available !== false ? Math.max(max, m.discountPercent ?? 0) : max),
    0
  );
  return clamp01(Math.max(promo, bestItem) / 100);
}

/** Score a single restaurant in [0,1]. */
export function scoreRestaurant(signals: RankSignals): number {
  const availability = signals.isOpen !== false && signals.acceptingOrders !== false ? 1 : 0;
  const speed = inverseBand(signals.prepTimeMinutes ?? 30, 10, 60);
  const price = inverseBand(signals.deliveryFee ?? 10, 0, 30);
  const distance =
    signals.distanceMeters === undefined
      ? 0.5
      : inverseBand(signals.distanceMeters, 0, MAX_RADIUS_METERS);

  return clamp01(
    RANK_WEIGHTS.rating * ratingScore(signals.rating, signals.ratingCount) +
      RANK_WEIGHTS.availability * availability +
      RANK_WEIGHTS.speed * speed +
      RANK_WEIGHTS.price * price +
      RANK_WEIGHTS.discount * discountScore(signals) +
      RANK_WEIGHTS.distance * distance
  );
}

/**
 * Return a new array of restaurants sorted by descending score, each annotated
 * with a `_score`. A `distanceOf` callback supplies metres per restaurant when
 * the user's location is known.
 */
export function rankRestaurants<T extends RankSignals>(
  restaurants: T[],
  distanceOf?: (r: T) => number | undefined
): (T & { _score: number })[] {
  return restaurants
    .map((r) => ({
      ...r,
      _score: scoreRestaurant(distanceOf ? { ...r, distanceMeters: distanceOf(r) } : r),
    }))
    .sort((a, b) => b._score - a._score);
}
