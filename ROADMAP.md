# MealMate — Production Roadmap & Gap Analysis

**Reviewed:** 10 Oct 2026 · **Stack:** Next.js 14 · TypeScript · MongoDB · Redux Toolkit
**Current maturity:** Early prototype · **Target:** Production MVP → full vision

> **The product in one line:** a restaurant-led food marketplace (like Bolt Food, but with the spotlight on restaurants) where restaurants compete on speed, price, discounts, availability and review ranking; clients discover nearby restaurants, order, pay and track delivery; and the app recommends based on buyer history. Three roles: **client, vendor, admin** (a fourth — courier — is effectively required for delivery).

---

## 0. Where things actually stand

The current build is a **single-user browsing-and-checkout demo**, not the platform described. It proves a few ideas convincingly — a live map with turn-by-turn directions, a cart, a Paystack button — but almost everything that defines the product (roles, real restaurant data, a vendor presence, delivery, recommendations) is absent or faked with static data.

**Honest summary:** a solid front-end starting point sitting on a near-empty back end. There is a large gap between the idea and the code.

| Capability | Status | What's really there |
|---|---|---|
| Map discovery & directions | ✅ Works | Google Maps with markers, geolocation, walking-route rendering. Solid. **API key hardcoded in client source.** |
| Cart | ✅ Works | Redux slice persisted to `localStorage`. Functional, but device-local and not tied to a user. |
| Payments (Paystack) | ⚠️ Partial | Button fires and clears the cart on success. No server-side verification, no webhook, hardcoded customer email, amount not in minor units (kobo/pesewas). |
| Restaurant / meal catalogue | ⚠️ Faked | 127 entries hardcoded in `src/components/data.ts`, scraped once by hand with corrupted encoding. Two placeholder meals each. |
| Orders API | ⚠️ Partial | Saves products + total to Mongo. No user, no address, no status, no payment link, **no auth on the route.** |
| Auth | ⚠️ Stub | NextAuth Google provider, JWT sessions. No roles, no DB adapter, no user record, not enforced anywhere. |
| Order history | ❌ Broken | Fetches the wrong endpoint and matches against static data; shows nothing real. |
| Vendor role & portal | ⛔ None | No concept of a vendor anywhere in the code. |
| Admin console | ⛔ None | Does not exist. |
| Live restaurant scraping / ingestion | ⛔ None | No pipeline. The "scrape" is a one-off paste. |
| Delivery tracking | ⛔ None | The map draws a route from user to restaurant — there is no courier, no order lifecycle, no live tracking. |
| Recommendations | ⛔ None | No per-user history store, no engine. |
| Ranking / reviews / discounts | ⛔ None | Ratings exist only as static strings copied from Google. |

**Scorecard:** ~1.2k lines of app code · **0 of 3 roles** actually implemented · 127 restaurants hardcoded · **4 critical security issues** blocking any launch.

---

## 1. Red flags — fix before anything else

These are not roadmap items to schedule; they make the current code **unsafe to run against real users or real money**. They belong in Phase 0.

1. **Secrets committed in source.** Google Maps and Firebase API keys are hardcoded in client files (`firebase.js`, `src/app/discover/page.tsx`). They are already exposed — rotate them, move to environment variables, and restrict by referrer/API.
2. **No authorization on any API route.** Anyone can `POST` restaurants, products and orders, or `GET` every order in the system. No authentication, ownership check or rate limiting (`src/app/api/*/route.ts`).
3. **Payments are not verified.** The client declares success and clears the cart; the server never confirms the charge with Paystack. Orders can be created without payment, and amounts aren't reconciled (`src/components/PayStack.tsx`, `api/orders`).
4. **Broken & dead code paths.** The restaurant model mislabels itself as `Products`, the order model bypasses the connection helper, the history page queries the wrong endpoint, and a dead Firebase v8 SDK sits unused alongside Mongo.

---

## 2. Gap analysis by domain

Each domain contrasts **Have** (today) with **Need** (production). This is the backlog, grouped. The restaurant spotlight the product wants — speed, price, discounts, availability, review ranking — lives mostly in domains **D, G**.

### A · Foundation & architecture — *needs hardening*
- **Have:** Next.js 14 App Router + TS + Tailwind; Redux Toolkit; a Mongoose connection singleton.
- **Need:** env/secret management per environment; one coherent data layer (drop unused Firebase); input validation (e.g. Zod) on every route; error handling, logging, monitoring (Sentry); CI + lint gates + staging; **automated tests (currently zero).**

### B · Identity, roles & access control — *largely missing*
- **Have:** NextAuth Google sign-in; JWT sessions.
- **Need:** persisted `User` records with a `role` (client/vendor/admin/courier); a DB adapter; email/phone + password or OTP (Google-only excludes many); role-based route/UI guards (middleware); vendor onboarding & verification; profiles, addresses, saved payment context.

### C · Restaurant data & ingestion ("scraping") — *faked*
- **Have:** a static list of 127 nearby restaurants with coordinates; proof that proximity + map rendering works.
- **Need:** a real ingestion pipeline (Google Places API / licensed source — **mind scraping terms of service**); geospatial storage + `$near` proximity queries in Mongo; scheduled refresh of hours/status/ratings; dedup + encoding cleanup + QA; a **claim flow** so real restaurants take over scraped listings.

### D · Vendor portal — *the spotlight · none today*
- **Have:** nothing — no vendor concept exists.
- **Need:** menu & item management (CRUD, photos, categories); pricing, discounts & promotions; real-time availability / open-closed / sold-out toggles; prep-time & "speed" signals that feed ranking; incoming-order dashboard (accept/reject); payouts, earnings, settlement; review responses & storefront analytics.

### E · Ordering, cart & payments — *partial*
- **Have:** client-side cart with quantities/totals; Paystack button (GHS); order docs saved to Mongo.
- **Need:** server-side payment verification + webhooks; correct currency math (minor units); orders tied to user, address, vendor & payment; full order lifecycle/state machine; delivery fees, service fees, tips, taxes; single-vendor-per-order rules & item validation; refunds/cancellations.

### F · Delivery & live tracking — *none*
- **Have:** map directions from user to a restaurant (walking mode).
- **Need:** a courier role + dispatch logic; status events (placed → accepted → prepared → picked up → delivered); live courier location via WebSockets/push; ETA calculation + customer tracking screen; proof of delivery; per-leg ratings.

### G · Discovery, search, ranking & recommendations — *none*
- **Have:** map view of all restaurants; static rating strings.
- **Need:** search & filtering (cuisine, price, distance, open now); a review system feeding real rankings; **ranking weighted by speed, price, discounts, availability, reviews**; **recommendations from each user's buyer history**; reorder, trending, nearby surfacing.

### H · Admin console — *none*
- **Have:** nothing.
- **Need:** vendor/courier approval & verification queue; user, order & dispute management; catalogue/data-quality moderation; platform fees, promotions, payout oversight; a metrics dashboard.

---

## 3. The roadmap — nine phases

Ordered by dependency, not strictly by calendar; several overlap (see §4). Durations assume **2–3 full-stack engineers** plus part-time design and QA.

### P0 · Stabilise & secure the foundation — *Weeks 1–3* ✅ **largely complete**
- ✅ Relocated all keys to env vars (`.env.example` / `.env.local`), hardened `.gitignore`. **Action still required:** rotate the exposed Maps/Firebase keys in their consoles and restrict them.
- ✅ Removed dead Firebase SDK; consolidated the two conflicting `next.config` files; MongoDB is the single store.
- ✅ Fixed the mislabeled restaurant model, cleaned the order model, rewired the broken history page, and fixed the Paystack minor-unit currency bug (`src/lib/money.ts`, tested).
- ✅ Added Zod request validation + consistent error envelopes + a logger (`src/lib/http.ts`) across all API routes.
- ✅ Stood up ESLint config, a Vitest harness (first passing tests), `typecheck`/`test` scripts, and GitHub Actions CI (lint → typecheck → test → build).
- ⬜ **Remaining:** real monitoring sink (Sentry/Datadog — logger is a stub), a hosted staging environment, and resolving `npm audit` advisories.
- **Exit:** no secrets in source ✅; every route validates input ✅; app builds, lints, type-checks and tests cleanly ✅; monitoring + staging ⬜.

### P1 · Identity, roles & RBAC — *Weeks 3–7* ✅ **largely complete**
- ✅ Persisted `User` model with role (client/vendor/admin/courier), status (active/pending/suspended), profile and addresses (`src/models/user.ts`).
- ✅ Migrated NextAuth to the App Router (`src/app/api/auth/[...nextauth]`), added a Credentials (email + bcrypt password) provider alongside Google, with `id`/`role`/`status` on the session (`src/lib/auth.ts`, typed in `src/types/next-auth.d.ts`).
- ✅ Registration endpoint with role selection (`/api/auth/register`); sign-in, register, account, and forbidden pages; session-aware header.
- ✅ Centralised role rules (`src/lib/roles.ts`, unit-tested) enforced in two layers: edge `middleware.ts` (redirects) and server guards (`requireRole` for APIs, per-page checks). The flagged P0 API routes now enforce roles (restaurants→admin, products→vendor/admin, orders→auth + per-user scoping).
- ✅ Vendor/courier onboarding entry points with pending-approval gating, plus a working admin verification queue (`/admin`, `/api/admin/users`).
- ⬜ **Remaining:** phone/OTP auth, email verification + password reset, and a profile/address editing UI (read-only for now).
- ⚠️ **Bootstrap:** admin is never self-assignable. Promote the first admin once by setting `role: "admin"` on their user document in MongoDB (see README).
- **Exit:** a user has a durable account and role ✅; protected routes reject the wrong role end to end (middleware + server guards) ✅.

### P2 · Real restaurant data & geosearch — *Weeks 5–10* ✅ **largely complete**
- ✅ Real geospatial `Restaurant` schema with GeoJSON `location`, a `2dsphere` index, embedded menu, claim/owner field and status (`src/models/restaurant.ts`). The UI no longer imports `data.ts` — it is now only an ingestion source.
- ✅ Pluggable ingestion pipeline (`src/lib/ingestion/`): a **local** source (normalises the 127 legacy records and repairs their mojibake encoding) and a **Google Places** source, behind one `RestaurantSource` interface. Upserts dedupe by `externalId`, so re-runs are idempotent.
- ✅ Scheduled refresh entry point: `POST /api/admin/ingest`, authorised by admin session or an `INGEST_SECRET` bearer token for cron.
- ✅ `$near` proximity search (`GET /api/restaurants?lat&lng&radius&q`) and detail (`GET /api/restaurants/:id`); discover, meal detail and HOT OFFERS all read from the DB by real proximity.
- ✅ Encoding cleanup, rating normalisation and geo-query building are unit-tested.
- ⬜ **Remaining:** a licensed production data source + its legal review, geocoding of addresses that lack coordinates, and QA dashboards for ingest health. Menu CRUD is intentionally deferred to P3.
- **Exit:** restaurants load from the database by real proximity to the user ✅; refreshable on a schedule ✅.

### P3 · Vendor portal — *Weeks 9–15*
- Listing claim & verification; menu/item CRUD with images and categories.
- Pricing, discounts and promotions; availability and open/closed/sold-out controls.
- Prep-time and speed signals captured for ranking.
- Vendor order dashboard (accept/reject) + basic storefront analytics.
- **Exit:** a verified vendor self-manages a storefront, menu, prices and availability without engineering help.

### P4 · Ordering & payments, done right — *Weeks 11–16* 🟢 **MVP milestone**
- Server-verified Paystack flow with webhooks; correct minor-unit amounts.
- Orders bound to user, address, vendor and payment; full status state machine.
- Fees, tips, taxes; refunds and cancellations.
- Server-synced cart; working, real order history.
- **Exit:** a real paid order flows from cart to a confirmed, verified record visible to client and vendor.

### P5 · Delivery & live tracking — *Weeks 16–22*
- Courier role, assignment/dispatch, order-event timeline.
- Live courier location over WebSockets/push; customer tracking screen with ETA.
- Proof of delivery; per-leg ratings.
- **Exit:** a customer watches an order progress and a courier move in real time until delivered.

### P6 · Discovery, ranking & recommendations — *Weeks 18–24*
- Search & filters (cuisine, price, distance, open now).
- Review system feeding a ranking weighted by speed, price, discounts, availability, reviews.
- History-based recommendations, reorder, trending, nearby surfacing.
- **Exit:** restaurants compete on real signals; returning users get relevant, personalised suggestions.

### P7 · Admin console — *Weeks 22–26*
- Vendor/courier approval queue; user, order, dispute management.
- Catalogue/data-quality moderation; fees, promotions, payout oversight.
- Operational metrics dashboard.
- **Exit:** operators run the marketplace — approvals, disputes, payouts — without database access.

### P8 · Hardening, QA & launch — *Weeks 25–28*
- Load, security and payment-reconciliation testing; accessibility pass.
- Legal: terms, privacy, data-source licensing, vendor agreements.
- Observability, on-call, backups, rollback plan.
- Pilot in one city, then general availability.
- **Exit:** the platform meets launch quality bars and operates reliably in a live pilot market.

---

## 4. Timeline at a glance

Roughly **6–7 months** to full production with a 2–3 engineer team, with a **public MVP at ~month 4** (end of Phase 4). Bars show overlap; each `█` is about half a month.

```
Month:              M1      M2      M3      M4      M5      M6      M7
P0 Foundation       ██
P1 Roles & RBAC       ███
P2 Data & geosearch     ████
P3 Vendor portal              █████
P4 Orders & payments            ████                         ← MVP
P5 Delivery tracking                  █████
P6 Ranking & recs                       █████
P7 Admin console                              ███
P8 Hardening & launch                            ███
```

**Estimates, not commitments.** Biggest swing factors: licensed API vs. genuine scraping for restaurant data (legal review adds weeks); how much delivery you own vs. outsource to a third-party logistics provider; team size (one engineer ≈ doubles the calendar; a dedicated FE/BE pair compresses the overlap).

---

## 5. Recommended cut lines

If the goal is to get something real in front of users fast, scope deliberately rather than building all nine phases before launch.

- **MVP (launch candidate) — P0, P1, P2, P4 + a thin slice of P3.** Secure foundation, real accounts and roles, live nearby restaurants, genuine verified ordering from a handful of hand-onboarded vendors. Delivery starts as manual coordination; tracking and recommendations follow.
- **Fast-follow — P3 (full), P5, P6.** Vendor self-service, live delivery tracking, and the ranking/recommendation layer that is the product's actual differentiator.
- **Scale — P7, P8.** Admin tooling and launch hardening as volume and the vendor/courier base grow.

> **Strategic note:** the pitch is "restaurants market themselves on speed, price, discounts, availability and review ranking." That value proposition lives almost entirely in **P3 and P6**. The MVP earns revenue; those two phases are what make MealMate different from Bolt Food rather than a clone. **Protect them from being cut.**

---

*Scope of this review: a full read of the current `mealmate/` Next.js codebase — pages, components, API routes, models, auth, state and data files — on 10 Oct 2026. Timeline and effort figures are planning estimates; re-validate once team size and the restaurant-data source are fixed.*
