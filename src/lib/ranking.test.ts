import { describe, it, expect } from "vitest";
import { scoreRestaurant, rankRestaurants, RankSignals } from "./ranking";

type R = RankSignals & { name?: string; id?: string };

describe("scoreRestaurant", () => {
  it("returns a score in [0,1]", () => {
    const s = scoreRestaurant({ rating: 4.5, ratingCount: 100 });
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });

  it("ranks a well-rated, confident restaurant above a poorly-rated one", () => {
    const good = scoreRestaurant({ rating: 4.8, ratingCount: 200, isOpen: true, acceptingOrders: true });
    const bad = scoreRestaurant({ rating: 2.0, ratingCount: 200, isOpen: true, acceptingOrders: true });
    expect(good).toBeGreaterThan(bad);
  });

  it("discounts low-confidence ratings toward neutral", () => {
    const few = scoreRestaurant({ rating: 5, ratingCount: 1 });
    const many = scoreRestaurant({ rating: 5, ratingCount: 200 });
    expect(many).toBeGreaterThan(few);
  });

  it("penalises a closed restaurant", () => {
    const open = scoreRestaurant({ rating: 4, ratingCount: 50, isOpen: true, acceptingOrders: true });
    const closed = scoreRestaurant({ rating: 4, ratingCount: 50, isOpen: false, acceptingOrders: true });
    expect(open).toBeGreaterThan(closed);
  });

  it("rewards faster prep and cheaper delivery", () => {
    const fastCheap = scoreRestaurant({ prepTimeMinutes: 10, deliveryFee: 0 });
    const slowPricey = scoreRestaurant({ prepTimeMinutes: 60, deliveryFee: 30 });
    expect(fastCheap).toBeGreaterThan(slowPricey);
  });

  it("rewards an active promotion or item discount", () => {
    const promo = scoreRestaurant({ promotion: { percentOff: 40, active: true } });
    const none = scoreRestaurant({ promotion: { percentOff: 40, active: false } });
    expect(promo).toBeGreaterThan(none);
  });

  it("rewards nearer restaurants when distance is known", () => {
    const near = scoreRestaurant({ distanceMeters: 200 });
    const far = scoreRestaurant({ distanceMeters: 40_000 });
    expect(near).toBeGreaterThan(far);
  });
});

describe("rankRestaurants", () => {
  it("sorts by descending score and annotates _score", () => {
    const ranked = rankRestaurants<R>([
      { name: "Meh", rating: 2, ratingCount: 50, isOpen: true },
      { name: "Great", rating: 4.8, ratingCount: 150, isOpen: true },
      { name: "Closed", rating: 5, ratingCount: 150, isOpen: false },
    ]);
    expect(ranked[0].name).toBe("Great");
    expect(ranked[0]._score).toBeGreaterThan(ranked[ranked.length - 1]._score);
  });

  it("applies a distance callback", () => {
    const ranked = rankRestaurants<R>(
      [
        { id: "far", rating: 4, ratingCount: 50, isOpen: true },
        { id: "near", rating: 4, ratingCount: 50, isOpen: true },
      ],
      (r) => (r.id === "near" ? 100 : 45_000)
    );
    expect(ranked[0].id).toBe("near");
  });
});
