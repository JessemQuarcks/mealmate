import { describe, it, expect } from "vitest";
import { reconcilePayment, VerifiedTransaction, ExpectedPayment } from "./reconcile";

const expected: ExpectedPayment = {
  amountMinor: 12500,
  currency: "GHS",
  reference: "mm_abc_def123",
};

const success: VerifiedTransaction = {
  status: "success",
  amount: 12500,
  currency: "GHS",
  reference: "mm_abc_def123",
};

describe("reconcilePayment", () => {
  it("accepts a fully matching successful transaction", () => {
    expect(reconcilePayment(success, expected)).toEqual({ ok: true });
  });

  it("rejects a non-successful transaction", () => {
    const r = reconcilePayment({ ...success, status: "failed" }, expected);
    expect(r.ok).toBe(false);
  });

  it("rejects an underpaid amount", () => {
    const r = reconcilePayment({ ...success, amount: 12499 }, expected);
    expect(r).toMatchObject({ ok: false });
    if (!r.ok) expect(r.reason).toContain("amount mismatch");
  });

  it("rejects a currency mismatch", () => {
    const r = reconcilePayment({ ...success, currency: "NGN" }, expected);
    expect(r).toMatchObject({ ok: false });
    if (!r.ok) expect(r.reason).toContain("currency");
  });

  it("rejects a reference that does not match the order", () => {
    const r = reconcilePayment({ ...success, reference: "mm_x_y999999" }, expected);
    expect(r).toMatchObject({ ok: false });
    if (!r.ok) expect(r.reason).toContain("reference");
  });
});
