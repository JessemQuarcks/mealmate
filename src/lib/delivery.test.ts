import { describe, it, expect } from "vitest";
import {
  haversineMeters,
  estimateEtaMinutes,
  etaBetween,
  formatDistance,
} from "./delivery";

describe("haversineMeters", () => {
  it("is zero for the same point", () => {
    expect(haversineMeters({ lat: 6.67, lng: -1.56 }, { lat: 6.67, lng: -1.56 })).toBe(0);
  });

  it("matches a known short distance within tolerance", () => {
    // ~1.11 km per 0.01 degree of latitude near the equator.
    const d = haversineMeters({ lat: 6.67, lng: -1.56 }, { lat: 6.68, lng: -1.56 });
    expect(d).toBeGreaterThan(1050);
    expect(d).toBeLessThan(1150);
  });
});

describe("estimateEtaMinutes", () => {
  it("returns at least 1 minute", () => {
    expect(estimateEtaMinutes(0)).toBe(1);
    expect(estimateEtaMinutes(-5)).toBe(1);
  });

  it("scales with distance and rounds up", () => {
    // 10 km at 20 km/h = 0.5 h = 30 min.
    expect(estimateEtaMinutes(10_000, 20)).toBe(30);
  });

  it("falls back to the default speed for bad input", () => {
    expect(estimateEtaMinutes(10_000, 0)).toBe(30);
  });
});

describe("etaBetween", () => {
  it("combines distance and ETA", () => {
    const eta = etaBetween({ lat: 6.67, lng: -1.56 }, { lat: 6.70, lng: -1.56 });
    expect(eta).toBeGreaterThan(0);
  });
});

describe("formatDistance", () => {
  it("uses metres under a kilometre", () => {
    expect(formatDistance(850)).toBe("850 m");
  });
  it("uses kilometres at or above 1 km", () => {
    expect(formatDistance(2340)).toBe("2.3 km");
  });
  it("handles invalid input", () => {
    expect(formatDistance(-1)).toBe("—");
  });
});
