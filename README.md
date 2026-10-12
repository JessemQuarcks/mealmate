# MealMate

A restaurant-led food marketplace: discover nearby restaurants, order, pay (Paystack) and track delivery live. Built with Next.js 14 (App Router), TypeScript, MongoDB/Mongoose and Redux Toolkit.

See [ROADMAP.md](./ROADMAP.md) for the gap analysis and the path to production.

## Getting started

> **Node.js 24+** is required (see `.nvmrc`). With nvm: `nvm use`.

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy the template and fill in real values:

```bash
cp .env.example .env.local
```

`.env.local` is git-ignored. **Never commit real secrets.** The keys that were
previously hardcoded in source are already exposed and must be rotated in their
consoles (Google Cloud, Firebase) and restricted before any production use.

| Variable | Purpose |
|---|---|
| `MONGO_DB_URL` | MongoDB connection string |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | NextAuth session signing / base URL |
| `GOOGLE_ID`, `GOOGLE_SECRET` | Google OAuth sign-in |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps (client, restrict by referrer) |
| `NEXT_PUBLIC_PAYSTACK_KEY` | Paystack public key |
| `PAYSTACK_SECRET_KEY` | Paystack secret — server-side verification, refunds and webhook signature |

### 3. Run

```bash
npm run dev     # start the dev server at http://localhost:3000
```

## Authentication & roles

Auth uses NextAuth (App Router) with two providers:

- **Google** — one-click sign-in; a `client` account is created on first login.
- **Email + password** — register at `/register`, hashed with bcrypt.

There are four roles — `client` (default), `vendor`, `courier`, `admin` — defined
in [src/lib/roles.ts](src/lib/roles.ts). Access is enforced in two layers:
edge middleware ([src/middleware.ts](src/middleware.ts)) redirects unauthorised
requests, and server-side guards (`requireRole` in
[src/lib/session.ts](src/lib/session.ts)) protect API routes and pages.

`vendor` and `courier` sign-ups start with `status: "pending"` and are approved
from the admin console at `/admin`.

> Set `NEXTAUTH_SECRET` in `.env.local` (`openssl rand -base64 32`) — middleware
> cannot read the session without it.

### Bootstrap the first admin

`admin` is never self-assignable. After registering a normal account, promote it
once directly in MongoDB:

```js
// mongosh, against your database
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

Then sign out/in and open `/admin`.

## Restaurant data & ingestion

Restaurants live in MongoDB with a GeoJSON `location` and a `2dsphere` index, so
the app serves them by real proximity. Ingestion sources are pluggable
([src/lib/ingestion/](src/lib/ingestion/)):

- **local** — normalises the legacy `src/components/data.ts` seed (127 records),
  repairing its mojibake encoding. Use this to populate a fresh database.
- **google** — Google Places Nearby Search; needs `GOOGLE_PLACES_API_KEY` and a
  location. (Review Google's caching terms before enabling scheduled refresh.)

Trigger a run via `POST /api/admin/ingest` — authorised by an admin session, or
by `Authorization: Bearer <INGEST_SECRET>` for a scheduled job:

```bash
# Seed from the local file (admin session or secret required)
curl -X POST http://localhost:3000/api/admin/ingest \
  -H "Authorization: Bearer $INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"source":"local"}'

# Refresh from Google Places around a point
curl -X POST http://localhost:3000/api/admin/ingest \
  -H "Authorization: Bearer $INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"source":"google","lat":6.6732,"lng":-1.5654,"radiusMeters":5000}'
```

For **scheduled refresh**, point a cron (external scheduler or a scheduled
GitHub Action) at that endpoint with the `INGEST_SECRET` header.

Query restaurants: `GET /api/restaurants?lat=&lng=&radius=&q=` (nearest-first via
`$near`; top-rated when no coordinates) and `GET /api/restaurants/:id`.

## Vendor portal

A verified vendor (an admin-approved `vendor` account) self-manages a storefront
at `/vendor`:

- **Claim** — search and claim an unowned restaurant listing (`/vendor/claim`).
- **Menu** — add/edit/remove items with category, price, per-item discount and a
  sold-out toggle (`/vendor/menu`).
- **Settings** — open/closed, accepting-orders, prep time, delivery fee and a
  promotion (`/vendor/settings`).
- **Orders** — accept / reject / mark preparing / ready, driven by a validated
  order state machine ([src/lib/orderStatus.ts](src/lib/orderStatus.ts)).
- **Overview** — basic analytics (orders, pending, revenue, menu count).

Every vendor API enforces an active-vendor check and per-restaurant ownership
([src/lib/vendor.ts](src/lib/vendor.ts)). Each checkout order is bound to a
`restaurant_id`, so it shows up in the owning vendor's order dashboard.

## Ordering & payments

Prices are **never** trusted from the browser. Checkout is a two-step,
server-verified flow:

1. **Initialise** — `POST /api/checkout` with `{ restaurant_id, items:[{id,
   quantity}], tip?, delivery_address }`. The server loads the restaurant,
   rejects it if closed, re-prices the cart against the live menu
   ([src/lib/cart.ts](src/lib/cart.ts)), computes the full breakdown — subtotal,
   delivery, service fee, tax, tip ([src/lib/fees.ts](src/lib/fees.ts)) — and
   creates a `pending` order with a minted payment reference. It returns the
   reference and the exact minor-unit amount to charge.
2. **Verify** — after Paystack reports success in the browser, `POST
   /api/checkout/verify` independently verifies the transaction with Paystack
   and reconciles the charged amount against what the order expected
   ([src/lib/paystack/](src/lib/paystack/)); only then is the payment marked
   `paid`. A signed **webhook** (`POST /api/payments/webhook`) is the backstop if
   the browser never returns.

Amounts are always integers in minor units at the Paystack boundary
([src/lib/money.ts](src/lib/money.ts)). An order carries two independent state
machines — fulfilment ([src/lib/orderStatus.ts](src/lib/orderStatus.ts)) and
payment ([src/lib/paymentStatus.ts](src/lib/paymentStatus.ts)).

Other order endpoints:

- `GET /api/orders` — the signed-in user's order history (`/history`).
- `GET /api/orders/:id` — a single order, owner-scoped.
- `POST /api/orders/:id/cancel` — customer cancels while still cancellable.
- `POST /api/vendor/orders/:id/refund` — vendor/admin full refund of a paid order.
- `GET|PUT|DELETE /api/cart` — the server-synced, single-vendor cart.

> Register your webhook in the Paystack dashboard as
> `{NEXTAUTH_URL}/api/payments/webhook`.

## Delivery & live tracking

Once a vendor marks an order **ready**, it enters courier dispatch:

- **Courier console** (`/courier/dashboard`) — a verified courier sees paid,
  ready, unclaimed orders and claims one. The claim is atomic, so two couriers
  can't grab the same order. The courier then marks it picked up
  (`out_for_delivery`) and delivered, capturing proof of delivery. Delivery
  transitions are guarded by a courier-only state machine
  ([src/lib/orderStatus.ts](src/lib/orderStatus.ts)).
- **Live location** — with "Share my location" on, the console watches the
  browser's geolocation and pings `POST /api/courier/orders/:id/location`.
- **Customer tracking** (`/track/:id`) — polls `GET /api/orders/:id/track` for
  status, the event timeline, the courier's position (plotted on a map) and a
  derived distance + ETA ([src/lib/delivery.ts](src/lib/delivery.ts)). After
  delivery the customer can rate the courier and restaurant.

Every state change appends to an order **event timeline**
([src/lib/orderEvents.ts](src/lib/orderEvents.ts)) so tracking shows full
history. Live updates use HTTP polling today; WebSocket/push is the planned
upgrade.

Courier/tracking endpoints:

- `GET /api/courier/orders` — dispatch feed (available + this courier's active).
- `POST /api/courier/orders/:id/assign` — claim a ready order.
- `PATCH /api/courier/orders/:id/status` — picked up / delivered (+ proof).
- `POST /api/courier/orders/:id/location` — report courier position.
- `GET /api/orders/:id/track` — customer tracking payload (status, ETA, events).
- `POST /api/orders/:id/rate` — rate courier/restaurant after delivery.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:watch` | Vitest in watch mode |

## Continuous integration

`.github/workflows/ci.yml` runs install → lint → typecheck → test → build on
every push and pull request. Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and
`NEXT_PUBLIC_PAYSTACK_KEY` as repository secrets so the build step has them.

## Project layout

```
src/
  app/            App Router pages and API routes
    api/          restaurants, checkout, orders, cart, payments, vendor, courier endpoints
    track/        customer live order-tracking screen
  components/     UI components (ui/, courier/, tracking/, vendor/)
  lib/            store, hooks, http helpers, money/fees, delivery, paystack/ client
  models/         Mongoose models
  utils/          mongo connection
```
