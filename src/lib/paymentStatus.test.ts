import { describe, it, expect } from "vitest";
import {
  canTransitionPayment,
  isPaid,
  isRefundable,
  INITIAL_PAYMENT_STATUS,
} from "./paymentStatus";

describe("payment status transitions", () => {
  it("starts pending", () => {
    expect(INITIAL_PAYMENT_STATUS).toBe("pending");
  });

  it("allows pending to become paid or failed", () => {
    expect(canTransitionPayment("pending", "paid")).toBe(true);
    expect(canTransitionPayment("pending", "failed")).toBe(true);
  });

  it("allows a paid order to be refunded", () => {
    expect(canTransitionPayment("paid", "refunded")).toBe(true);
  });

  it("forbids reviving a failed or refunded payment", () => {
    expect(canTransitionPayment("failed", "paid")).toBe(false);
    expect(canTransitionPayment("refunded", "paid")).toBe(false);
  });

  it("forbids refunding something that was never paid", () => {
    expect(canTransitionPayment("pending", "refunded")).toBe(false);
  });
});

describe("predicates", () => {
  it("isPaid is true only for paid", () => {
    expect(isPaid("paid")).toBe(true);
    expect(isPaid("pending")).toBe(false);
  });

  it("isRefundable is true only for paid", () => {
    expect(isRefundable("paid")).toBe(true);
    expect(isRefundable("refunded")).toBe(false);
  });
});
