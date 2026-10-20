import { describe, it, expect } from "vitest";
import { hit, clientIp } from "./rateLimit";

describe("hit", () => {
  it("allows up to the limit, then blocks within the window", () => {
    const key = `test-${Math.random()}`;
    const t = 1_000_000;
    expect(hit(key, 2, 1000, t).allowed).toBe(true);
    expect(hit(key, 2, 1000, t).allowed).toBe(true);
    const third = hit(key, 2, 1000, t);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const key = `test-${Math.random()}`;
    const t = 2_000_000;
    hit(key, 1, 1000, t);
    expect(hit(key, 1, 1000, t).allowed).toBe(false);
    expect(hit(key, 1, 1000, t + 1001).allowed).toBe(true);
  });

  it("reports remaining budget", () => {
    const key = `test-${Math.random()}`;
    expect(hit(key, 3, 1000, 5_000_000).remaining).toBe(2);
  });
});

describe("clientIp", () => {
  it("takes the first x-forwarded-for entry", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" } });
    expect(clientIp(req)).toBe("1.1.1.1");
  });
  it("falls back to x-real-ip then unknown", () => {
    expect(clientIp(new Request("http://x", { headers: { "x-real-ip": "9.9.9.9" } }))).toBe("9.9.9.9");
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});
