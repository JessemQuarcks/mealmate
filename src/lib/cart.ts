/**
 * Cart validation and pricing. The browser sends *which* items and how many,
 * but never the prices — those are resolved here against the restaurant's live
 * menu so a tampered cart can't buy a GHS 50 meal for GHS 1. A cart must also
 * belong to exactly one restaurant; mixed-vendor carts are rejected upstream.
 */
import { effectiveItemPrice, isItemOrderable } from "@/lib/pricing";
import { cartTotal } from "@/lib/money";

export interface RequestedItem {
  id: string;
  quantity: number;
}

export interface MenuItemLike {
  id: string;
  name: string;
  image?: string;
  price: number;
  discountPercent?: number;
  available?: boolean;
}

export interface PricedLine {
  id: string;
  name: string;
  image: string;
  /** Effective per-unit price after any discount, in major units. */
  price: number;
  quantity: number;
}

export type CartPricingResult =
  | { ok: true; lines: PricedLine[]; subtotal: number }
  | { ok: false; reason: string };

/**
 * Resolve requested items against a menu, applying discounts and checking
 * availability. Returns authoritative priced lines and a subtotal, or the first
 * reason the cart cannot be fulfilled.
 */
export function priceCart(
  requested: ReadonlyArray<RequestedItem>,
  menu: ReadonlyArray<MenuItemLike>
): CartPricingResult {
  if (requested.length === 0) {
    return { ok: false, reason: "Your cart is empty" };
  }

  const byId = new Map(menu.map((m) => [m.id, m]));
  const lines: PricedLine[] = [];

  for (const { id, quantity } of requested) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { ok: false, reason: `Invalid quantity for item ${id}` };
    }
    const item = byId.get(id);
    if (!item) {
      return { ok: false, reason: `Item ${id} is no longer on the menu` };
    }
    if (!isItemOrderable(item)) {
      return { ok: false, reason: `"${item.name}" is sold out` };
    }
    lines.push({
      id: item.id,
      name: item.name,
      image: item.image ?? "",
      price: effectiveItemPrice(item),
      quantity,
    });
  }

  return { ok: true, lines, subtotal: cartTotal(lines) };
}
