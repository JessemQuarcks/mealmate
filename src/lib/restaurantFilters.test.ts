import { describe, it, expect } from "vitest";
import {
  parseRestaurantQuery,
  buildRestaurantMongoFilter,
  hasCoords,
} from "./restaurantFilters";

const parse = (qs: string) => parseRestaurantQuery(new URLSearchParams(qs));

describe("parseRestaurantQuery", () => {
  it("defaults sort to rank and limit within bounds", () => {
    const p = parse("");
    expect(p.sort).toBe("rank");
    expect(p.limit).toBe(50);
    expect(p.openNow).toBe(false);
  });

  it("reads filters", () => {
    const p = parse("q=jollof&cuisine=ghanaian&maxPrice=2&openNow=true&sort=distance&limit=10");
    expect(p).toMatchObject({
      q: "jollof",
      cuisine: "ghanaian",
      maxPriceLevel: 2,
      openNow: true,
      sort: "distance",
      limit: 10,
    });
  });

  it("clamps the limit to 1..100", () => {
    expect(parse("limit=9999").limit).toBe(100);
    expect(parse("limit=-5").limit).toBe(50);
  });

  it("ignores an invalid sort", () => {
    expect(parse("sort=banana").sort).toBe("rank");
  });
});

describe("buildRestaurantMongoFilter", () => {
  it("always scopes to active restaurants", () => {
    expect(buildRestaurantMongoFilter(parse(""))).toMatchObject({ status: "active" });
  });

  it("adds a text $or for q", () => {
    const f = buildRestaurantMongoFilter(parse("q=pizza"));
    expect(Array.isArray(f.$or)).toBe(true);
    expect((f.$or as unknown[]).length).toBe(3);
  });

  it("filters by cuisine, price and open-now", () => {
    const f = buildRestaurantMongoFilter(parse("cuisine=thai&maxPrice=3&openNow=1"));
    expect(f.cuisines).toMatchObject({ $regex: "thai" });
    expect(f.priceLevel).toEqual({ $lte: 3 });
    expect(f.isOpen).toBe(true);
    expect(f.acceptingOrders).toBe(true);
  });
});

describe("hasCoords", () => {
  it("is true only with both lat and lng", () => {
    expect(hasCoords(parse("lat=6.6&lng=-1.5"))).toBe(true);
    expect(hasCoords(parse("lat=6.6"))).toBe(false);
    expect(hasCoords(parse(""))).toBe(false);
  });
});
