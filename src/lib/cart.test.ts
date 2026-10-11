import { describe, it, expect } from "vitest";
import { priceCart, MenuItemLike } from "./cart";

const menu: MenuItemLike[] = [
  { id: "a", name: "Jollof", price: 30, available: true },
  { id: "b", name: "Waakye", price: 20, discountPercent: 50, available: true },
  { id: "c", name: "Banku", price: 25, available: false },
];

describe("priceCart", () => {
  it("prices items from the menu, not from the request", () => {
    const r = priceCart([{ id: "a", quantity: 2 }], menu);
    expect(r).toMatchObject({ ok: true });
    if (r.ok) {
      expect(r.lines[0].price).toBe(30);
      expect(r.subtotal).toBe(60);
    }
  });

  it("applies the current discount", () => {
    const r = priceCart([{ id: "b", quantity: 1 }], menu);
    if (r.ok) expect(r.subtotal).toBe(10);
    else throw new Error(r.reason);
  });

  it("rejects an empty cart", () => {
    expect(priceCart([], menu)).toMatchObject({ ok: false });
  });

  it("rejects an item that is not on the menu", () => {
    const r = priceCart([{ id: "zzz", quantity: 1 }], menu);
    expect(r).toMatchObject({ ok: false });
    if (!r.ok) expect(r.reason).toContain("no longer on the menu");
  });

  it("rejects a sold-out item", () => {
    const r = priceCart([{ id: "c", quantity: 1 }], menu);
    expect(r).toMatchObject({ ok: false });
    if (!r.ok) expect(r.reason).toContain("sold out");
  });

  it("rejects non-positive or fractional quantities", () => {
    expect(priceCart([{ id: "a", quantity: 0 }], menu)).toMatchObject({ ok: false });
    expect(priceCart([{ id: "a", quantity: 1.5 }], menu)).toMatchObject({ ok: false });
  });
});
