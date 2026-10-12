import { describe, it, expect } from "vitest";
import { buildTrackPayload, isTerminalStatus } from "./trackPayload";

describe("buildTrackPayload", () => {
  it("derives distance and ETA when both points are known", () => {
    const p = buildTrackPayload({
      status: "out_for_delivery",
      courier: { name: "Dan" },
      courier_location: { coordinates: [-1.61, 6.69], updatedAt: null },
      delivery_address: { lat: 6.7, lng: -1.6 },
    });
    expect(p.courier).toEqual({ name: "Dan" });
    expect(p.courier_location).toMatchObject({ lat: 6.69, lng: -1.61 });
    expect(p.distance_meters).toBeGreaterThan(0);
    expect(p.eta_minutes).toBeGreaterThan(0);
  });

  it("leaves distance/ETA null without a courier position", () => {
    const p = buildTrackPayload({ status: "placed", delivery_address: { lat: 6.7, lng: -1.6 } });
    expect(p.courier).toBeNull();
    expect(p.distance_meters).toBeNull();
    expect(p.eta_minutes).toBeNull();
  });

  it("defaults a nameless courier label", () => {
    const p = buildTrackPayload({ status: "ready", courier: {} });
    expect(p.courier).toEqual({ name: "Your courier" });
  });
});

describe("isTerminalStatus", () => {
  it("recognises terminal states", () => {
    expect(isTerminalStatus("delivered")).toBe(true);
    expect(isTerminalStatus("cancelled")).toBe(true);
    expect(isTerminalStatus("rejected")).toBe(true);
  });
  it("treats in-flight states as non-terminal", () => {
    expect(isTerminalStatus("out_for_delivery")).toBe(false);
    expect(isTerminalStatus("placed")).toBe(false);
  });
});
