import { describe, it, expect } from "vitest";
import { isStalePending, splitPending, DEFAULT_STALE_MS } from "./reconciliation";

const now = 2_000_000_000_000;
const pendingAt = (ms: number) => ({ payment: { status: "pending" }, createdAt: new Date(ms) });

describe("isStalePending", () => {
  it("is true for an old pending order", () => {
    expect(isStalePending(pendingAt(now - DEFAULT_STALE_MS - 1), now)).toBe(true);
  });
  it("is false for a recent pending order", () => {
    expect(isStalePending(pendingAt(now - 1000), now)).toBe(false);
  });
  it("is false for non-pending orders", () => {
    expect(isStalePending({ payment: { status: "paid" }, createdAt: new Date(0) }, now)).toBe(false);
  });
});

describe("splitPending", () => {
  it("separates stale and recent, ignoring non-pending", () => {
    const { stale, recent } = splitPending(
      [
        pendingAt(now - DEFAULT_STALE_MS - 5000),
        pendingAt(now - 2000),
        { payment: { status: "paid" }, createdAt: new Date(0) },
      ],
      now
    );
    expect(stale).toHaveLength(1);
    expect(recent).toHaveLength(1);
  });
});
