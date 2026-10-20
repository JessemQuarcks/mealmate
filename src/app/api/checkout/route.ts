import { z } from "zod";
import Order from "@/models/order";
import { getRestaurantModel } from "@/models/restaurant";
import mongodbConnect from "@/utils/mongoConnect";
import { fail, logger, ok, parseBody, withErrorHandling } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { priceCart } from "@/lib/cart";
import { computeOrderTotals } from "@/lib/fees";
import { toMinorUnits } from "@/lib/money";
import { buildPaymentReference } from "@/lib/paystack/reference";
import { buildEvent, ORDER_EVENTS } from "@/lib/orderEvents";
import { getPlatformSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  restaurant_id: z.string().min(1),
  items: z
    .array(z.object({ id: z.string().min(1), quantity: z.number().int().positive() }))
    .min(1, "An order needs at least one item"),
  tip: z.number().nonnegative().optional(),
  delivery_address: z.object({
    label: z.string().optional(),
    line1: z.string().min(1, "A delivery address is required"),
    line2: z.string().optional(),
    city: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
});

/**
 * Initialise a checkout. The server loads the restaurant, re-prices the cart
 * against the live menu, computes the authoritative total and creates a
 * `pending` order carrying a freshly minted payment reference. The browser
 * then pays exactly that reference and amount; nothing the client sent about
 * price is trusted.
 */
export const POST = withErrorHandling(async (req) => {
  const { user, response } = await requireRole();
  if (response) return response;

  if (!user.email) {
    return fail("An email is required to pay for an order", 422);
  }

  const { data, error } = await parseBody(req, checkoutSchema);
  if (error) return error;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const Restaurant = await getRestaurantModel();
  if (!Restaurant) return fail("Database is not available", 503);

  const restaurant = await Restaurant.findById(data.restaurant_id);
  if (!restaurant || restaurant.status !== "active") {
    return fail("Restaurant is not available", 404);
  }
  if (!restaurant.isOpen || !restaurant.acceptingOrders) {
    return fail("This restaurant is not accepting orders right now", 409);
  }

  const priced = priceCart(data.items, restaurant.menu);
  if (!priced.ok) return fail(priced.reason, 422);

  // Fees are admin-configurable platform settings (Phase 7), not hardcoded.
  const settings = await getPlatformSettings();
  const CURRENCY = settings.currency;

  const totals = computeOrderTotals(priced.subtotal, {
    deliveryFee: restaurant.deliveryFee,
    serviceFeePercent: settings.serviceFeePercent,
    taxPercent: settings.taxPercent,
    tip: data.tip,
  });

  const reference = buildPaymentReference();
  const amountMinor = toMinorUnits(totals.grandTotal);

  const order = await Order.create({
    user_id: user.id,
    restaurant_id: String(restaurant._id),
    restaurant_name: restaurant.name,
    products: priced.lines.map((l) => ({
      id: l.id,
      name: l.name,
      image: l.image,
      price: l.price,
      quantity: l.quantity,
    })),
    subtotal: totals.subtotal,
    delivery_fee: totals.deliveryFee,
    service_fee: totals.serviceFee,
    tax: totals.tax,
    tip: totals.tip,
    total_amount: totals.grandTotal,
    currency: CURRENCY,
    delivery_address: data.delivery_address,
    payment: {
      provider: "paystack",
      reference,
      status: "pending",
      amountMinor,
      currency: CURRENCY,
    },
    events: [buildEvent(ORDER_EVENTS.placed)],
  });

  logger.info("Checkout initialised", {
    order: order.id,
    user: user.id,
    amountMinor,
    reference,
  });

  // The client needs exactly these to drive Paystack; the amount is in minor
  // units and must not be recomputed in the browser.
  return ok(
    {
      order_id: order.id,
      reference,
      email: user.email,
      amount: amountMinor,
      currency: CURRENCY,
      totals,
    },
    201
  );
});
