import { describe, it, expect } from "vitest";
import { computeVendorPayouts, isPayable, orderEarnings, PayableOrder } from "./payouts";
import { disputeCanResolve } from "./dispute";

const paidDelivered: PayableOrder = {
  restaurant_id: "r1",
  restaurant_name: "Jollof Joint",
  ownerUserId: "v1",
  subtotal: 30,
  tip: 5,
  status: "delivered",
  payment: { status: "paid" },
};

describe("isPayable", () => {
  it("accepts a paid, delivered, un-refunded order", () => {
    expect(isPayable(paidDelivered)).toBe(true);
  });
  it("rejects unpaid, undelivered or refunded orders", () => {
    expect(isPayable({ ...paidDelivered, payment: { status: "pending" } })).toBe(false);
    expect(isPayable({ ...paidDelivered, status: "out_for_delivery" })).toBe(false);
    expect(isPayable({ ...paidDelivered, refund: { amountMinor: 100 } })).toBe(false);
  });
});

describe("orderEarnings", () => {
  it("is food subtotal plus tip (not delivery/service fee)", () => {
    expect(orderEarnings(paidDelivered)).toBe(35);
  });
});

describe("computeVendorPayouts", () => {
  it("sums payable orders per vendor and sorts by owed desc", () => {
    const rows = computeVendorPayouts([
      paidDelivered,
      { ...paidDelivered, subtotal: 20, tip: 0 },
      { restaurant_id: "r2", ownerUserId: "v2", subtotal: 100, tip: 0, status: "delivered", payment: { status: "paid" } },
      { ...paidDelivered, status: "cancelled" }, // excluded
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ vendorUserId: "v2", owed: 100 });
    expect(rows[1]).toMatchObject({ vendorUserId: "v1", owed: 55, orderCount: 2 });
  });

  it("falls back to an ownerOf lookup when ownerUserId is missing", () => {
    const rows = computeVendorPayouts(
      [{ restaurant_id: "r9", subtotal: 10, status: "delivered", payment: { status: "paid" } }],
      (id) => (id === "r9" ? "ownerX" : undefined)
    );
    expect(rows[0].vendorUserId).toBe("ownerX");
  });
});

describe("disputeCanResolve", () => {
  it("allows open → resolved/rejected only", () => {
    expect(disputeCanResolve("open", "resolved")).toBe(true);
    expect(disputeCanResolve("open", "rejected")).toBe(true);
    expect(disputeCanResolve("resolved", "open")).toBe(false);
    expect(disputeCanResolve("rejected", "resolved")).toBe(false);
  });
});
