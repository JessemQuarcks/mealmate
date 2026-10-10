# MealMate

A restaurant-led food marketplace: discover nearby restaurants, order, pay (Paystack) and track delivery. Built with Next.js 14 (App Router), TypeScript, MongoDB/Mongoose and Redux Toolkit.

See [ROADMAP.md](./ROADMAP.md) for the gap analysis and the path to production.

## Getting started

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
| `PAYSTACK_SECRET_KEY` | Paystack secret (server-side verification, Phase 4) |

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
    api/          restaurants, products, orders endpoints
  components/     UI components
  lib/            store, hooks, http helpers, money utils
  models/         Mongoose models
  utils/          mongo connection
```
