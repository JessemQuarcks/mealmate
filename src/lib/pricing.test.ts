import { describe, it, expect } from "vitest";
import { discountedPrice, effectiveItemPrice, isItemOrderable } from "./pricing";

describe("discountedPrice", () => {
  it("returns the price when there is no discount", () => {
    expect(discountedPrice(20, undefined)).toBe(20);
    expect(discountedPrice(20, 0)).toBe(20);
  });
  it("applies and rounds a percentage discount", () => {
    expect(discountedPrice(20, 25)).toBe(15);
    expect(discountedPrice(9.99, 10)).toBe(8.99);
  });
  it("clamps discount at 100%", () => {
    expect(discountedPrice(20, 150)).toBe(0);
  });
  it("guards invalid prices", () => {
    expect(discountedPrice(-5, 10)).toBe(0);
  });
});

describe("effectiveItemPrice", () => {
  it("uses the item discount", () => {
    expect(effectiveItemPrice({ price: 50, discountPercent: 20 })).toBe(40);
    expect(effectiveItemPrice({ price: 50 })).toBe(50);
  });
});

describe("isItemOrderable", () => {
  it("is false when sold out", () => {
    expect(isItemOrderable({ available: false, price: 10 })).toBe(false);
  });
  it("is true when available and priced", () => {
    expect(isItemOrderable({ available: true, price: 10 })).toBe(true);
    expect(isItemOrderable({ price: 0 })).toBe(true);
  });
});
