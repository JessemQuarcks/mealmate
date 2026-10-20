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

## Design & theming

The UI is built on a green token-based design system defined in
[src/app/globals.css](src/app/globals.css) and [tailwind.config.ts](tailwind.config.ts):
colors are RGB-channel CSS variables (`--bg`, `--surface`, `--fg`, `--muted`,
`--line`, `--brand`) exposed as Tailwind classes (`bg-surface`, `text-fg`,
`text-muted`, `border-line`, `text-brand`), so one set of classes works in both
themes. Light/dark is handled by [ThemeProvider](src/app/ThemeProvider.tsx) +
a no-flash init script in the layout and the sun/moon
[ThemeToggle](src/components/ThemeToggle.tsx) (default dark, persisted to
localStorage). The animated landing lives in
[src/components/landing/](src/components/landing/) (3D `CardRing`, scroll
`Reveal`, live featured picks); chrome is the floating-pill
[SiteHeader](src/components/SiteHeader.tsx) and [Footer](src/components/Footer.tsx).
Account self-service is at `/account` and `/account/settings` (name, phone and
saved delivery addresses via `GET`/`PATCH /api/account/profile`).

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

### Superadmins (all-role access)

Emails in the `SUPERADMIN_EMAILS` allowlist ([src/lib/superadmin.ts](src/lib/superadmin.ts),
the project owner included by default) are elevated to `admin` + `active` on
every sign-in. Because `admin` is a role superset, one such account reaches the
admin, vendor and courier areas (linked from the header and `/account`) and
still orders as a client — handy for testing every role from one login.

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

**Location-driven ingestion.** The discover map calls `POST /api/discovery/sync`
with the user's coordinates when they enter a new area. If that area is sparse
(and `GOOGLE_PLACES_API_KEY` is set) it scrapes nearby restaurants from Google
Places **once** — deduped per ~5 km grid cell with a cooldown
([src/lib/ingestion/coverage.ts](src/lib/ingestion/coverage.ts),
[CoverageCell](src/models/coverageCell.ts)) — so results are genuinely nearby,
not hardcoded. The client fires this only after moving ~2.5 km
([src/lib/useLocationSync.ts](src/lib/useLocationSync.ts)). The local seed is
kept as a last-resort fallback so discovery is never an empty page.

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
- **Customer tracking** (`/track/:id`) — subscribes to a **Server-Sent Events**
  stream (`GET /api/orders/:id/track/stream`) for push updates, falling back to
  polling `GET /api/orders/:id/track`. Shows status, the event timeline, the
  courier's position (plotted on a map) and a derived distance + ETA
  ([src/lib/delivery.ts](src/lib/delivery.ts)). After delivery the customer can
  rate the courier and restaurant.

Every state change appends to an order **event timeline**
([src/lib/orderEvents.ts](src/lib/orderEvents.ts)) so tracking shows full
history. The tracking payload is built once in
[src/lib/trackPayload.ts](src/lib/trackPayload.ts) and shared by the stream and
the polling endpoint. SSE is used over raw WebSockets because it needs no custom
server; the full courier flow is covered by
[src/test/courierFlow.test.ts](src/test/courierFlow.test.ts).

Courier/tracking endpoints:

- `GET /api/courier/orders` — dispatch feed (available + this courier's active).
- `POST /api/courier/orders/:id/assign` — claim a ready order.
- `PATCH /api/courier/orders/:id/status` — picked up / delivered (+ proof).
- `POST /api/courier/orders/:id/location` — report courier position.
- `GET /api/orders/:id/track` — customer tracking payload (status, ETA, events).
- `GET /api/orders/:id/track/stream` — the same payload pushed over SSE.
- `POST /api/orders/:id/rate` — rate courier/restaurant after delivery.

## Discovery, ranking & recommendations

The **/browse** page is the discovery surface: debounced search with cuisine,
max-price, open-now and sort controls, plus optional "use my location" for
distance-aware results and "Order again" / "Trending now" rails.

- **Search & filters** — `GET /api/restaurants` takes `q`, `cuisine`,
  `maxPrice`, `openNow` and `sort=rank|distance|rating`
  ([src/lib/restaurantFilters.ts](src/lib/restaurantFilters.ts)).
- **Ranking** — the default `rank` sort scores each restaurant 0–1 by rating
  (confidence-weighted), open/accepting-orders, prep speed, delivery fee, live
  discount and distance ([src/lib/ranking.ts](src/lib/ranking.ts)).
- **Reviews** — `GET /api/restaurants/:id/reviews` aggregates the ratings
  customers leave on delivered orders (average + recent comments), shown on the
  restaurant page and fed back as a ranking signal.
- **Recommendations** — `GET /api/recommendations` returns the signed-in user's
  reorder list (distinct recent restaurants) and trending restaurants (most
  ordered in the last 30 days).

## Admin console

Admins (and superadmins) run the marketplace from `/admin` without touching the
database. The section is guarded by the admin layout and middleware; sub-pages:

- **Overview** — operational metrics (`GET /api/admin/metrics`): users by
  role/status, orders by status, GMV + platform revenue, 7/30-day volume, open
  disputes, live vs hidden restaurants.
- **Users** (`/admin/users`) — approval queue, search, role changes, suspend
  (`GET/PATCH /api/admin/users`).
- **Orders** (`/admin/orders`, `/admin/orders/:id`) — filter by
  status/payment/dispute/text; inspect the breakdown + timeline; issue refunds
  (`POST /api/admin/orders/:id/refund`) and resolve/reject disputes with an
  optional refund (`PATCH /api/admin/orders/:id/dispute`). Customers raise a
  dispute from tracking via `POST /api/orders/:id/dispute`.
- **Catalogue** (`/admin/restaurants`) — hide/unhide restaurants (hidden ones
  leave discovery), delivery-fee/promotion overrides, and a local-seed trigger
  (`GET/PATCH /api/admin/restaurants`).
- **Payouts** (`/admin/payouts`) — owed per vendor (food + tips on delivered,
  paid, un-refunded orders; `src/lib/payouts.ts`) net of a `Payout` ledger, with
  mark-as-paid (`GET/POST /api/admin/payouts`).
- **Settings** (`/admin/settings`) — platform service-fee %, tax % and currency
  (`GET/PATCH /api/admin/settings`); checkout reads these via
  `getPlatformSettings()` instead of hardcoded constants.

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
