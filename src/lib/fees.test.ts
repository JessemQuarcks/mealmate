import { describe, it, expect } from "vitest";
import { computeOrderTotals } from "./fees";

describe("computeOrderTotals", () => {
  it("returns the subtotal alone when no fees apply", () => {
    const t = computeOrderTotals(50);
    expect(t).toEqual({
      subtotal: 50,
      deliveryFee: 0,
      serviceFee: 0,
      tax: 0,
      tip: 0,
      grandTotal: 50,
    });
  });

  it("adds delivery, service, tax and tip into the grand total", () => {
    const t = computeOrderTotals(100, {
      deliveryFee: 10,
      serviceFeePercent: 5,
      taxPercent: 12.5,
      tip: 8,
    });
    expect(t.serviceFee).toBe(5);
    expect(t.tax).toBe(12.5);
    expect(t.grandTotal).toBe(100 + 10 + 5 + 12.5 + 8);
  });

  it("treats negative or non-finite inputs as zero", () => {
    const t = computeOrderTotals(-5, {
      deliveryFee: -10,
      serviceFeePercent: NaN,
      tip: -1,
    });
    expect(t.subtotal).toBe(0);
    expect(t.deliveryFee).toBe(0);
    expect(t.grandTotal).toBe(0);
  });

  it("clamps percentages at 100", () => {
    const t = computeOrderTotals(20, { serviceFeePercent: 150 });
    expect(t.serviceFee).toBe(20);
  });

  it("rounds to two decimals without float drift", () => {
    const t = computeOrderTotals(0.1, { serviceFeePercent: 10 });
    expect(t.serviceFee).toBe(0.01);
    expect(t.grandTotal).toBe(0.11);
  });
});
