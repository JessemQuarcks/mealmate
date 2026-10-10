import { describe, it, expect } from "vitest";
import { toMinorUnits, fromMinorUnits, cartTotal } from "./money";

describe("toMinorUnits", () => {
  it("converts whole amounts", () => {
    expect(toMinorUnits(12)).toBe(1200);
  });

  it("converts fractional amounts without float drift", () => {
    expect(toMinorUnits(12.1)).toBe(1210);
    expect(toMinorUnits(0.1)).toBe(10);
  });

  it("handles zero", () => {
    expect(toMinorUnits(0)).toBe(0);
  });

  it("rejects negative and non-finite amounts", () => {
    expect(() => toMinorUnits(-1)).toThrow();
    expect(() => toMinorUnits(NaN)).toThrow();
  });
});

describe("fromMinorUnits", () => {
  it("is the inverse of toMinorUnits", () => {
    expect(fromMinorUnits(toMinorUnits(45.99))).toBeCloseTo(45.99);
  });
});

describe("cartTotal", () => {
  it("sums price * quantity across items", () => {
    const total = cartTotal([
      { price: 10, quantity: 2 },
      { price: 5.5, quantity: 1 },
    ]);
    expect(total).toBe(25.5);
  });

  it("returns 0 for an empty cart", () => {
    expect(cartTotal([])).toBe(0);
  });

  it("avoids floating point accumulation errors", () => {
    expect(cartTotal([{ price: 0.1, quantity: 3 }])).toBe(0.3);
  });
});
