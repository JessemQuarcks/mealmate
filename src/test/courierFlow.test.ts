import { describe, it, expect, beforeEach, vi } from "vitest";

// A mutable "current user" the mocked session reads, so each step can act as a
// particular courier or the customer.
const h = vi.hoisted(() => ({ user: null as Record<string, unknown> | null }));

vi.mock("@/utils/mongoConnect", () => ({ default: async () => ({}) }));

vi.mock("@/lib/session", async () => {
  const { fail } = await import("@/lib/http");
  const { hasRole } = await import("@/lib/roles");
  return {
    getSessionUser: async () => h.user,
    requireRole: async (allowed?: unknown) => {
      const user = h.user;
      if (!user) return { user: null, response: fail("Authentication required", 401) };
      if (allowed && !hasRole(user.role as never, allowed as never))
        return { user: null, response: fail("Forbidden", 403) };
      return { user, response: null };
    },
  };
});

vi.mock("@/models/order", () => import("@/test/orderStore"));

// Imported after the mocks are registered (vi.mock is hoisted). The store
// controls come straight from the fake — the same singleton the mock installs
// for @/models/order — so TypeScript sees their real types.
import { __reset, __seed, __get } from "@/test/orderStore";
import { POST as claim } from "@/app/api/courier/orders/[id]/assign/route";
import { PATCH as advance } from "@/app/api/courier/orders/[id]/status/route";
import { POST as ping } from "@/app/api/courier/orders/[id]/location/route";
import { GET as feed } from "@/app/api/courier/orders/route";
import { GET as track } from "@/app/api/orders/[id]/track/route";
import { POST as rate } from "@/app/api/orders/[id]/rate/route";

const COURIER = { id: "cour1", role: "courier", status: "active", name: "Dispatch Dan" };
const COURIER2 = { id: "cour2", role: "courier", status: "active", name: "Rival Rider" };
const PENDING = { id: "courP", role: "courier", status: "pending" };
const CUSTOMER = { id: "cust1", role: "client", status: "active", email: "c@x.co" };

function seedReadyOrder(id = "ORD1") {
  return __seed({
    _id: id,
    user_id: "cust1",
    status: "ready",
    payment: { status: "paid" },
    restaurant_name: "Jollof Joint",
    products: [{ id: "a", name: "Jollof", quantity: 2 }],
    total_amount: 70,
    currency: "GHS",
    delivery_address: { line1: "12 Main St", city: "Kumasi", lat: 6.7, lng: -1.6 },
    events: [],
  });
}

const base = "http://localhost/api";
const req = (url: string, init?: RequestInit) => new Request(url, init);
const json = (body: unknown) => ({
  method: "PATCH",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

beforeEach(() => {
  __reset();
  h.user = null;
});

describe("courier delivery flow", () => {
  it("runs claim → pickup → location → track → deliver → rate", async () => {
    seedReadyOrder();

    // 1. Courier sees it in the dispatch feed.
    h.user = COURIER;
    let res = await feed(req(`${base}/courier/orders`));
    let body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.available).toHaveLength(1);
    expect(body.data.active).toHaveLength(0);

    // 2. Claim it.
    res = await claim(req(`${base}/courier/orders/ORD1/assign`, { method: "POST" }));
    body = await res.json();
    expect(res.status).toBe(200);
    expect(__get("ORD1")?.courier).toMatchObject({ user_id: "cour1" });
    expect((__get("ORD1")?.events as { type: string }[]).some((e) => e.type === "courier.assigned")).toBe(true);

    // 3. Now it is active, not available.
    res = await feed(req(`${base}/courier/orders`));
    body = await res.json();
    expect(body.data.available).toHaveLength(0);
    expect(body.data.active).toHaveLength(1);

    // 4. Picked up.
    res = await advance(req(`${base}/courier/orders/ORD1/status`, json({ status: "out_for_delivery" })));
    expect(res.status).toBe(200);
    expect(__get("ORD1")?.status).toBe("out_for_delivery");

    // 5. Report location.
    res = await ping(
      req(`${base}/courier/orders/ORD1/location`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lat: 6.69, lng: -1.61 }),
      })
    );
    expect(res.status).toBe(200);
    expect((__get("ORD1")?.courier_location as { coordinates: number[] }).coordinates).toEqual([-1.61, 6.69]);

    // 6. Customer tracks it: status, courier, ETA.
    h.user = CUSTOMER;
    res = await track(req(`${base}/orders/ORD1/track`));
    body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.status).toBe("out_for_delivery");
    expect(body.data.courier.name).toBe("Dispatch Dan");
    expect(body.data.eta_minutes).toBeGreaterThan(0);
    expect(body.data.distance_meters).toBeGreaterThanOrEqual(0);

    // 7. Delivered with proof.
    h.user = COURIER;
    res = await advance(
      req(`${base}/courier/orders/ORD1/status`, json({ status: "delivered", proof: { note: "Left at gate" } }))
    );
    expect(res.status).toBe(200);
    expect(__get("ORD1")?.status).toBe("delivered");
    expect((__get("ORD1")?.proof_of_delivery as { note: string }).note).toBe("Left at gate");

    // 8. Customer rates courier and restaurant.
    h.user = CUSTOMER;
    res = await rate(req(`${base}/orders/ORD1/rate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ courier: 5, restaurant: 4 }) }));
    body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.ratings).toMatchObject({ courier: 5, restaurant: 4 });
  });

  it("rejects a second courier claiming the same order", async () => {
    seedReadyOrder();
    h.user = COURIER;
    expect((await claim(req(`${base}/courier/orders/ORD1/assign`, { method: "POST" }))).status).toBe(200);

    h.user = COURIER2;
    const res = await claim(req(`${base}/courier/orders/ORD1/assign`, { method: "POST" }));
    expect(res.status).toBe(409);
  });

  it("forbids a courier advancing an order they weren't assigned", async () => {
    const o = seedReadyOrder();
    o.courier = { user_id: "cour1", assignedAt: new Date() };
    h.user = COURIER2;
    const res = await advance(req(`${base}/courier/orders/ORD1/status`, json({ status: "out_for_delivery" })));
    expect(res.status).toBe(403);
  });

  it("rejects an illegal delivery transition", async () => {
    const o = seedReadyOrder();
    o.courier = { user_id: "cour1", assignedAt: new Date() };
    h.user = COURIER;
    // ready → delivered is not allowed (must go via out_for_delivery).
    const res = await advance(req(`${base}/courier/orders/ORD1/status`, json({ status: "delivered" })));
    expect(res.status).toBe(422);
  });

  it("blocks a pending (unverified) courier", async () => {
    seedReadyOrder();
    h.user = PENDING;
    const res = await feed(req(`${base}/courier/orders`));
    expect(res.status).toBe(403);
  });

  it("won't let a customer rate before delivery", async () => {
    const o = seedReadyOrder();
    o.status = "out_for_delivery";
    h.user = CUSTOMER;
    const res = await rate(
      req(`${base}/orders/ORD1/rate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ courier: 5 }) })
    );
    expect(res.status).toBe(409);
  });
});
