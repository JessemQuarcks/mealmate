import { describe, it, expect } from "vitest";
import { canTransition, vendorCanSet } from "./orderStatus";

describe("canTransition", () => {
  it("allows legal transitions", () => {
    expect(canTransition("placed", "accepted")).toBe(true);
    expect(canTransition("accepted", "preparing")).toBe(true);
    expect(canTransition("preparing", "ready")).toBe(true);
    expect(canTransition("ready", "out_for_delivery")).toBe(true);
  });
  it("rejects illegal jumps", () => {
    expect(canTransition("placed", "ready")).toBe(false);
    expect(canTransition("delivered", "accepted")).toBe(false);
    expect(canTransition("rejected", "accepted")).toBe(false);
  });
});

describe("vendorCanSet", () => {
  it("permits vendor actions", () => {
    expect(vendorCanSet("placed", "accepted")).toBe(true);
    expect(vendorCanSet("placed", "rejected")).toBe(true);
    expect(vendorCanSet("preparing", "ready")).toBe(true);
  });
  it("forbids states a vendor shouldn't set", () => {
    // Delivery states belong to the courier (Phase 5).
    expect(vendorCanSet("ready", "out_for_delivery")).toBe(false);
    expect(vendorCanSet("out_for_delivery", "delivered")).toBe(false);
  });
});
