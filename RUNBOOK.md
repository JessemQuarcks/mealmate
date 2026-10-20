# Mealmate — Operations Runbook

Operational reference for running Mealmate in production. Pairs with
[README.md](./README.md) (features/setup) and [ROADMAP.md](./ROADMAP.md) (phases).

## Environments & deploy

- **Runtime:** Node.js **24+** (`.nvmrc`), Next.js 14 (App Router).
- **Build/verify:** `npm ci && npm run lint && npm run typecheck && npm test && npm run build`.
  CI runs this on every push/PR (`.github/workflows/ci.yml`).
- **Host:** any Node host or a serverless platform (Vercel). Set all env vars from
  [.env.example](./.env.example). Build-time public vars:
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_PAYSTACK_KEY`.
- **Secrets to rotate before launch:** the Google Maps/Firebase keys that were
  previously committed, plus a fresh `NEXTAUTH_SECRET` (`openssl rand -base64 32`).

## Health & observability

- **Health probe:** `GET /api/health` → `200 {status:"ok",db:true}` or `503`
  when the database is unreachable. Point your load balancer / uptime monitor here.
- **Logging:** structured logger in [src/lib/http.ts](src/lib/http.ts). Set
  `LOG_SINK_URL` to forward `warn`/`error` logs to Sentry/Datadog/Logtail/Slack.
  Unhandled route errors return a short `ref` id that matches the logged entry.
- **Rate limiting:** per-IP fixed window ([src/lib/rateLimit.ts](src/lib/rateLimit.ts))
  on register/checkout/dispute/sync. In-memory today — back it with Redis/Upstash
  for multi-instance deployments (call sites don't change).

## Payments

- **Flow:** `POST /api/checkout` (server prices the cart) → Paystack → confirm via
  `POST /api/checkout/verify`; signed webhook `POST /api/payments/webhook` is the
  backstop. Register the webhook in the Paystack dashboard as
  `{NEXTAUTH_URL}/api/payments/webhook`.
- **Reconciliation:** the admin overview shows pending payments; stale ones
  (`> 30 min`) can be re-verified from an order's detail page
  (`POST /api/admin/orders/:id/verify`). Reconcile before closing the books.
- **Refunds move real money** — test in the Paystack sandbox before production.

## Data

- **Store:** MongoDB (Atlas). Seed the catalogue from the admin console
  (`/admin/restaurants` → "Run local seed") or `POST /api/admin/ingest`.
- **Backups:** enable Atlas continuous/cloud backups (or `mongodump` on a
  schedule). Verify a restore into a scratch cluster quarterly.
- **Location ingestion:** `POST /api/discovery/sync` scrapes Google Places for a
  user's area once per grid cell (needs `GOOGLE_PLACES_API_KEY`); review Google's
  caching terms before relying on it at scale.

## Rollback

- Deploys are immutable builds: **roll back by redeploying the previous build**
  (Vercel: promote the prior deployment; self-host: deploy the prior tag).
- No destructive schema migrations exist yet; new fields are additive and
  optional, so an older build tolerates newer documents. Re-check before adding
  any required field or data backfill.

## Admin access

- Superadmins (`SUPERADMIN_EMAILS`, owner included) are elevated to admin on
  sign-in and reach every area from `/admin`. Bootstrap the first ordinary admin
  by setting `role:"admin"` on their user document (see README).

## On-call quick checks

1. `GET /api/health` green? If `db:false`, check Atlas status/IP allowlist/`MONGO_DB_URL`.
2. Payments stuck? Admin overview → reconciliation → re-verify stale pending orders.
3. Spiking errors? Check the `LOG_SINK_URL` destination; each error has a `ref` id.
4. Bad listing live? `/admin/restaurants` → hide it (drops from discovery immediately).

## Deferred (pre-GA, not yet automated)

Load & security penetration testing, a full Content-Security-Policy (needs
per-origin tuning), finalised legal copy (the `/terms` and `/privacy` pages are
templates), formal on-call rotation/paging, and the single-city pilot.
