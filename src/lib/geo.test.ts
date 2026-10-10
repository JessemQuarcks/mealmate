import { describe, it, expect } from "vitest";
import {
  parseCoordParam,
  clampRadius,
  nearbyFilter,
  DEFAULT_RADIUS_METERS,
  MAX_RADIUS_METERS,
} from "./geo";

describe("parseCoordParam", () => {
  it("parses valid numbers", () => {
    expect(parseCoordParam("6.67")).toBeCloseTo(6.67);
    expect(parseCoordParam("-1.58")).toBeCloseTo(-1.58);
  });
  it("returns undefined for empty or invalid", () => {
    expect(parseCoordParam(null)).toBeUndefined();
    expect(parseCoordParam("")).toBeUndefined();
    expect(parseCoordParam("abc")).toBeUndefined();
  });
});

describe("clampRadius", () => {
  it("defaults when missing or invalid", () => {
    expect(clampRadius(undefined)).toBe(DEFAULT_RADIUS_METERS);
    expect(clampRadius(0)).toBe(DEFAULT_RADIUS_METERS);
  });
  it("caps at the maximum", () => {
    expect(clampRadius(999999)).toBe(MAX_RADIUS_METERS);
  });
  it("passes through valid values", () => {
    expect(clampRadius(2000)).toBe(2000);
  });
});

describe("nearbyFilter", () => {
  it("builds a $near filter in GeoJSON order", () => {
    const filter = nearbyFilter(-1.58, 6.67, 3000);
    expect(filter.location.$near.$geometry.coordinates).toEqual([-1.58, 6.67]);
    expect(filter.location.$near.$maxDistance).toBe(3000);
  });
});
