import { describe, it, expect } from "vitest";
import { buildEvent, describeEvent, ORDER_EVENTS } from "./orderEvents";

describe("buildEvent", () => {
  it("stamps the event with the given time", () => {
    const at = new Date("2026-01-01T10:00:00Z");
    expect(buildEvent(ORDER_EVENTS.paid, undefined, at)).toEqual({
      type: ORDER_EVENTS.paid,
      at,
    });
  });

  it("includes a note only when provided", () => {
    const at = new Date();
    expect(buildEvent(ORDER_EVENTS.delivered, "Left at the door", at)).toEqual({
      type: ORDER_EVENTS.delivered,
      at,
      note: "Left at the door",
    });
  });

  it("defaults the timestamp to now", () => {
    const before = Date.now();
    const e = buildEvent(ORDER_EVENTS.placed);
    expect(e.at.getTime()).toBeGreaterThanOrEqual(before);
  });
});

describe("describeEvent", () => {
  it("labels known event types", () => {
    expect(describeEvent(ORDER_EVENTS.pickedUp)).toBe("Picked up — on the way");
  });
  it("falls back to the raw type for unknown events", () => {
    expect(describeEvent("some.custom.event")).toBe("some.custom.event");
  });
});
