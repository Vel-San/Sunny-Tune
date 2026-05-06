[![CI](https://github.com/Vel-San/Sunny-Tune/actions/workflows/ci.yml/badge.svg)](https://github.com/Vel-San/Sunny-Tune/actions/workflows/ci.yml)
[![Lighthouse CI](https://github.com/Vel-San/Sunny-Tune/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/Vel-San/Sunny-Tune/actions/workflows/lighthouse.yml)
[![Secret Scan](https://github.com/Vel-San/Sunny-Tune/actions/workflows/secret-scan.yml/badge.svg)](https://github.com/Vel-San/Sunny-Tune/actions/workflows/secret-scan.yml)
[![Dependency Review](https://github.com/Vel-San/Sunny-Tune/actions/workflows/dependency-review.yml/badge.svg)](https://github.com/Vel-San/Sunny-Tune/actions/workflows/dependency-review.yml)
[![CodeQL](https://img.shields.io/badge/CodeQL-enabled-blue?logo=github&logoColor=white)](https://github.com/Vel-San/Sunny-Tune/security/code-scanning)

[![Live](https://img.shields.io/badge/Live-sunny--tune.vercel.app-black?logo=vercel&logoColor=white)](https://sunny-tune.vercel.app)
[![API](https://img.shields.io/badge/API-Vercel_Serverless-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![Version](https://img.shields.io/badge/version-2.2.3-blue)](CHANGELOG.md)

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-brightgreen?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

- [SunnyTune ☀️](#sunnytune-️)
  - [Stack](#stack)
  - [What is Prisma?](#what-is-prisma)
  - [Generating Secrets](#generating-secrets)
  - [Scripts Reference](#scripts-reference)
    - [Local Development](#local-development)
    - [Testing](#testing)
    - [Docker — Development (`docker-compose.dev.yml`)](#docker--development-docker-composedevyml)
    - [Docker — Production (`docker-compose.yml`)](#docker--production-docker-composeyml)
  - [Quick Start — Docker (recommended)](#quick-start--docker-recommended)
    - [1. Create the root `.env` file](#1-create-the-root-env-file)
    - [2. Build and start](#2-build-and-start)
    - [3. First-time database migration](#3-first-time-database-migration)
    - [4. Open the app](#4-open-the-app)
  - [Quick Start — Without Docker](#quick-start--without-docker)
    - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Authentication](#authentication)
    - [Display name](#display-name)
    - [Moving to a new device](#moving-to-a-new-device)
    - [Token revocation](#token-revocation)
  - [Adding New SunnyPilot / Comma AI Features](#adding-new-sunnypilot--comma-ai-features)
    - [Staying up to date with upstream](#staying-up-to-date-with-upstream)
    - [SunnyPilot vs Comma AI — the `source` field](#sunnypilot-vs-comma-ai--the-source-field)
    - [Adding a feature](#adding-a-feature)
  - [Running Database Migrations](#running-database-migrations)
    - [When to migrate](#when-to-migrate)
    - [Dev environment (Docker)](#dev-environment-docker)
    - [Prod environment (Docker)](#prod-environment-docker)
    - [Local development (no Docker)](#local-development-no-docker)
    - [After migrating](#after-migrating)
  - [Security](#security)
    - [Admin secret — bcrypt hashing](#admin-secret--bcrypt-hashing)
    - [Admin IP allowlist](#admin-ip-allowlist)
    - [Token revocation](#token-revocation-1)
  - [Config Import / Export](#config-import--export)
  - [QR Code Sharing](#qr-code-sharing)
  - [Verified Vehicle List](#verified-vehicle-list)
  - [SP Version Compatibility Filter](#sp-version-compatibility-filter)
  - [Configuration Sharing](#configuration-sharing)
  - [Deploying Online (Vercel — Frontend \& Backend)](#deploying-online-vercel--frontend--backend)
    - [One-time setup](#one-time-setup)
    - [Manual deployment (without GitHub Actions)](#manual-deployment-without-github-actions)
  - [GitHub Actions Workflows](#github-actions-workflows)
  - [Project Structure](#project-structure)

# SunnyTune ☀️

> _Fine-tune your SunnyPilot. Share. Drive chill._

A community web application for creating, storing, and sharing [SunnyPilot](https://www.sunnypilot.ai/) and [Comma AI](https://comma.ai/) openpilot configurations. Build fully-detailed configs through a structured UI covering all SunnyPilot parameters — lateral/longitudinal control, speed limiting, lane changes, navigation, UI settings, Comma AI core options, and advanced tuning.

Configs can be shared via a unique public URL. After sharing you can continue editing and saving — each save increments the version counter so the community always sees your latest tune.

> **Contributing?** See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide — setup, code style, how to add SP parameters, PR process, and more.
> **Security?** See [SECURITY.md](SECURITY.md) for the responsible disclosure process and architecture overview.

---

## Stack

| Layer     | Technology                        |
| --------- | --------------------------------- |
| Frontend  | React 18 + TypeScript + Vite 8    |
| Styling   | Tailwind CSS (dark zinc theme)    |
| Icons     | Lucide React                      |
| State     | Zustand + TanStack Query          |
| QR Codes  | qrcode.react (SVG, ESM-safe)      |
| Backend   | Node.js + Express + TypeScript    |
| ORM       | Prisma 5 (see below)              |
| Database  | PostgreSQL 16                     |
| Auth      | Bearer token (UUID, no password)  |
| Container | Docker + Docker Compose           |
| Testing   | Vitest + @testing-library/react   |
| Deploy    | Vercel (frontend) + any Node host |

---

## What is Prisma?

**Prisma** is a type-safe ORM (Object-Relational Mapper) for Node.js. Instead of writing raw SQL, you define your database schema in `server/prisma/schema.prisma` and Prisma generates a fully-typed client that lets you interact with PostgreSQL using plain TypeScript objects.

Key things Prisma handles for this project:

- **Schema** — `schema.prisma` is the single source of truth for the database structure (users, configurations, ratings, comments, likes, favorites, collections, notifications, reports, page views)
- **Migrations** — `npx prisma migrate dev` auto-generates and applies SQL migrations when the schema changes
- **Client** — `npx prisma generate` builds the TypeScript client used in `server/src/config/database.ts`
- **Prisma Studio** — a visual database browser, accessible via the `docker:*:studio` npm scripts

When you add a new field to `schema.prisma`, run `npx prisma migrate dev --name describe_your_change` and both the database and the TypeScript types update automatically.

---

## Generating Secrets

```bash
# TOKEN_SECRET — used to sign/validate bearer tokens (32+ chars)
openssl rand -hex 32

# ADMIN_SECRET — password for the /admin panel
openssl rand -hex 24

# POSTGRES_PASSWORD — database admin password
openssl rand -hex 16

# Node.js alternative (if openssl is not available)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Scripts Reference

All scripts are run from the **project root** unless noted otherwise.

### Local Development

| Script               | What it does                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm run dev`        | Starts **both** the Express server (port 3001) and the Vite client (port 5173) concurrently with hot reload |
| `npm run dev:server` | Starts only the Express backend with `tsx watch`                                                            |
| `npm run dev:client` | Starts only the Vite frontend dev server                                                                    |
| `npm run build`      | Compiles the TypeScript server (`tsc`) then builds the Vite client bundle                                   |
| `npm run clean`      | Removes all `node_modules` directories and compiled output (`client/dist`, `server/dist`)                   |
| `npm run clean:vite` | Clears only the Vite cache (`client/node_modules/.vite`) — fixes stale HMR issues without a full reinstall  |

### Testing

| Script                | What it does                                                         |
| --------------------- | -------------------------------------------------------------------- |
| `npm test`            | Runs **all** tests — server (Vitest/Node) then client (Vitest/jsdom) |
| `npm run test:server` | Runs only the server-side tests                                      |
| `npm run test:client` | Runs only the client-side tests (React Testing Library)              |

Tests live in `__tests__/` directories next to the code they test. All tests must pass — Docker builds will also fail if tests fail.

### Docker — Development (`docker-compose.dev.yml`)

Dev containers use hot reload: source files are bind-mounted so changes take effect without rebuilding. Project name: `sp-dev`.

| Script                            | What it does                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `npm run docker:dev:build`        | Builds the dev Docker images (runs tests during build — fails fast on test failures)                               |
| `npm run docker:dev:build:clean`  | Same as above but forces a full rebuild with `--no-cache` — use when `package.json` or base images change          |
| `npm run docker:dev:up`           | Starts the full dev stack (DB + server + client) in the **foreground** — logs stream to your terminal              |
| `npm run docker:dev:up:d`         | Starts the dev stack in the **background** (detached mode)                                                         |
| `npm run docker:dev:down`         | Stops and removes all dev containers (database data is preserved)                                                  |
| `npm run docker:dev:down:v`       | Stops containers **and wipes the database volume** — gives you a completely fresh DB on next start                 |
| `npm run docker:dev:fresh`        | Tears down, removes local images, force-rebuilds, and starts in the background — full reset in one command         |
| `npm run docker:dev:restart`      | Restarts all running dev services without rebuilding                                                               |
| `npm run docker:dev:logs`         | Tails the live logs from all dev containers (Ctrl+C to exit)                                                       |
| `npm run docker:dev:upgrade`      | Pulls the latest base images, rebuilds all services, and restarts them — useful for keeping base images up-to-date |
| `npm run docker:dev:shell:server` | Opens an interactive shell (`sh`) **inside the running server container**                                          |
| `npm run docker:dev:shell:db`     | Opens a `psql` session **inside the running database container**                                                   |
| `npm run docker:dev:migrate`      | Runs `prisma migrate dev` inside the server container — use this after changing `schema.prisma`                    |
| `npm run docker:dev:studio`       | Starts Prisma Studio inside the container — opens a database browser at **http://localhost:5555**                  |

Dev URLs: **http://localhost:5173** (client) · **http://localhost:3001** (API)

### Docker — Production (`docker-compose.yml`)

Prod containers use multi-stage builds (smaller images, no dev dependencies). Prisma migrations run automatically on container start. Project name: `sp-prod`.

| Script                             | What it does                                                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm run docker:prod:build`        | Builds the production Docker images (runs tests during build)                                                        |
| `npm run docker:prod:build:clean`  | Same as above but forces a full rebuild with `--no-cache`                                                            |
| `npm run docker:prod:up`           | Starts the full prod stack in the **foreground** — logs stream to your terminal                                      |
| `npm run docker:prod:up:d`         | Starts the prod stack in the **background** (detached mode)                                                          |
| `npm run docker:prod:down`         | Stops and removes all prod containers (database data is preserved)                                                   |
| `npm run docker:prod:down:v`       | Stops prod containers **and wipes the database volume**                                                              |
| `npm run docker:prod:fresh`        | Tears down, removes local images, force-rebuilds, and starts in the background — same as `docker:dev:fresh` for prod |
| `npm run docker:prod:restart`      | Restarts prod services without rebuilding                                                                            |
| `npm run docker:prod:logs`         | Tails live logs from prod containers                                                                                 |
| `npm run docker:prod:upgrade`      | Pulls latest base images, rebuilds prod, and performs a rolling restart                                              |
| `npm run docker:prod:shell:server` | Shell inside the running prod server container                                                                       |
| `npm run docker:prod:shell:db`     | `psql` session inside the prod database container                                                                    |
| `npm run docker:prod:migrate`      | Runs `prisma migrate deploy` inside the prod server (safe for production — never resets data)                        |
| `npm run docker:prod:studio`       | Prisma Studio against the prod database at **http://localhost:5555**                                                 |

Prod URL: **http://localhost** (port 80 by default; set `CLIENT_PORT` in your `.env` to change it)

> **Dev + prod can run simultaneously** — they use separate Docker project names (`sp-dev` / `sp-prod`), separate networks, and separate database volumes.

> **Dev and prod databases are completely isolated.**
> Dev uses the `postgres_dev_data` volume; prod uses `postgres_data`. They have no shared storage, network, or containers — wiping dev with `docker:dev:down:v` has zero effect on prod.

---

## Quick Start — Docker (recommended)

### 1. Create the root `.env` file

```bash
cd /path/to/sunny-tune
cat > .env << EOF
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(openssl rand -hex 16)
TOKEN_SECRET=$(openssl rand -hex 32)
ADMIN_SECRET=$(openssl rand -hex 24)
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:3001
EOF
```

### 2. Build and start

```bash
npm run docker:dev:build    # builds images + runs all tests
npm run docker:dev:up:d     # starts DB + server + client in background
```

### 3. First-time database migration

```bash
npm run docker:dev:migrate
# When prompted: enter a migration name, e.g. "init"
```

### 4. Open the app

- App: **http://localhost:5173**
- Admin panel: **http://localhost:5173/admin** (use your `ADMIN_SECRET` as the password)
- API: **http://localhost:3001**

> **LAN access:** The Vite dev server binds to `0.0.0.0` (via `host: true` in `vite.config.ts`), so the client is also reachable from other devices on your local network at `http://<your-machine-IP>:5173`. Set `CORS_ORIGIN` and `VITE_API_URL` in your root `.env` to your machine's LAN IP if you want cross-device testing.

From now on, `npm run docker:dev:up:d` is all you need.

---

## Quick Start — Without Docker

### Prerequisites

- Node.js 20+
- PostgreSQL 16 running locally

```bash
# 1. Install all dependencies (monorepo workspaces)
npm install

# 2. Create server environment file
cp .env.example server/.env
# Edit server/.env — set DATABASE_URL, TOKEN_SECRET, ADMIN_SECRET, CORS_ORIGIN

# 3. Create client environment file
echo "VITE_API_URL=http://localhost:3001" > client/.env

# 4. Run database migrations (creates all tables)
cd server
npx prisma migrate dev --name init
cd ..

# 5. Start both services with hot reload
npm run dev
```

- Client: **http://localhost:5173**
- Server API: **http://localhost:3001**

---

## Environment Variables

Copy `.env.example` to `server/.env` and fill in the values:

```env
DATABASE_URL="postgresql://postgres:changeme@localhost:5432/sptune"
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173

# Generate with: openssl rand -hex 32
TOKEN_SECRET=replace_me

# Generate with: openssl rand -hex 24
# Leave empty/unset to disable the admin panel entirely
ADMIN_SECRET=replace_me
```

For Docker, place these in a `.env` file at the project root (Docker Compose reads it automatically):

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=replace_me
TOKEN_SECRET=replace_me
# Use ADMIN_SECRET_HASH (bcrypt) for production — see Security section below
ADMIN_SECRET_HASH=replace_me_with_bcrypt_hash
# Or plaintext fallback (not recommended for production):
# ADMIN_SECRET=replace_me
ADMIN_ALLOWED_IPS=               # comma-separated IPs; empty = no IP restriction
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:3001
CLIENT_PORT=80                   # host port to expose the nginx frontend on
```

---

## Authentication

SunnyTune uses **anonymous UUID tokens** — no sign-up or password required.

- On first visit, the client auto-calls `POST /api/users/register` which returns a `sp_<uuid>` token.
- The token is stored in `localStorage` under `sp_user_token` and sent as `Authorization: Bearer sp_...` on every request.
- To view your token: click the key icon in the header to open the Token modal.

### Display name

Users can set an optional display name in the Token modal. Once set it appears on all shared configs (visible to others on the shared config page and explore cards) and auto-fills the comment nickname field. The name can be changed or cleared at any time.

On first visit after v2.2.1, a one-time dismissable banner below the header prompts users to set their name.

### Moving to a new device

If you open SunnyTune on a new device it will generate a fresh token (disconnecting you from your existing configs). To restore access:

1. Copy your token from the Token modal on your original device.
2. On the new device, open the Token modal and click **Use token from another device…**
3. Paste the token and click **Confirm**. SunnyTune validates it server-side and, if valid, replaces the generated token immediately.

If the token is invalid, the previous token is automatically restored — you will not be left in a broken state.

### Token revocation

Access the admin panel at `/admin`. You'll be prompted for the `ADMIN_SECRET` (or the plain-text value behind `ADMIN_SECRET_HASH`) value set in your environment.

The secret is stored only in `sessionStorage` (cleared automatically when the browser tab closes — never in `localStorage`).

Admin panel features:

- **Dashboard** — total users, configs, collections, ratings, comments, likes, pending reports, page views, engagement trends
- **Users** — list all users with config counts, view details, delete accounts
- **Configurations** — browse all configs, filter by shared, force-unshare, delete
- **Analytics** — page view analytics broken down by path and day
- **Reports** — review and action user-submitted content reports

Security measures:

- `ADMIN_SECRET` checked with `crypto.timingSafeEqual` (timing-attack safe)
- Rate limiter: 10 requests/min per IP on all admin endpoints
- Secret never echoed in any server response
- If `ADMIN_SECRET` is unset or too short the entire admin API returns `503`

---

## Adding New SunnyPilot / Comma AI Features

### Staying up to date with upstream

The best sources for new SP and Comma AI parameters:

1. **SunnyPilot changelog** — [RELEASES.md](https://github.com/sunnypilot/sunnypilot/blob/master/RELEASES.md) and [GitHub releases](https://github.com/sunnypilot/sunnypilot/releases) document every new `SP_*` param per version.
2. **SunnyPilot source** — search for `Params().put` / `Params().get` in the [sunnypilot repo](https://github.com/sunnypilot/sunnypilot) to find all param keys in use.
3. **openpilot params** — the canonical Comma AI param list lives inside `selfdrive/` in the [openpilot repo](https://github.com/commaai/openpilot).
4. **Community forum** — [community.sunnypilot.ai](https://community.sunnypilot.ai/) often documents new features before the changelog catches up.

### SunnyPilot vs Comma AI — the `source` field

Every registry entry has a **required** `source` field. TypeScript will refuse to compile if you omit it:

| Value          | Meaning                             | When to use                                  |
| -------------- | ----------------------------------- | -------------------------------------------- |
| `'sunnypilot'` | Exclusive to the SP fork            | Params with `SP_*` prefix, SP-only behaviour |
| `'openpilot'`  | Stock Comma AI / upstream openpilot | Params that exist in vanilla openpilot       |

The `source` field is used internally for registry bookkeeping. The SP / Comma AI origin chips (yellow/blue badges) that previously appeared in the config editor UI have been removed — the `source` field is still required in the registry but is no longer rendered visually.

### Adding a feature

All configurable parameters are registered in `client/src/lib/featureRegistry.ts`. Adding a new feature:

```typescript
// client/src/lib/featureRegistry.ts — add to the relevant section array:
{
  id: 'myNewFeature',           // must match the key in SPConfig
  section: 'commaAI',           // longitudinal | laneChange | commaAI | advanced
  label: 'My New Feature',
  description: 'What it does and when to use it.',
  type: 'toggle',               // toggle | number | slider | select | text
  default: false,
  source: 'sunnypilot',         // REQUIRED: 'sunnypilot' or 'openpilot'
  experimental: true,           // shows an "Experimental" badge in the UI
  since: '0.9.8',               // SP version that introduced this param
  spKey: 'MY_NEW_FEATURE_PARAM',// original param name in SP/openpilot source
},
```

Then:

1. Add the field to both the `SPConfig` interface and `createDefaultConfig()` in `client/src/types/config.ts`
2. For dynamically-rendered sections the `<ParamRow>` is auto-generated from the registry
3. For manually-laid-out sections (e.g. `VehicleSection`), add a `<ParamRow spKey="MY_NEW_FEATURE_PARAM" ...>` in the component
4. **Optionally** register help text in `client/src/lib/fieldHelp.ts` — when present, a ⓘ icon appears on hover in the config editor and shared config page:

```typescript
// client/src/lib/fieldHelp.ts — add to FIELD_HELP:
MY_NEW_FEATURE_PARAM: {
  summary: "One-sentence description shown in the tooltip.",
  tips: ["Practical tip for users."],
  tradeoffs: ["Any downsides or caveats."],
  defaultNote: "Disabled",
  recommended: "Enabled for most cars",
  docsUrl: "https://docs.sunnypilot.ai/settings/section-name/",
},
```

---

## Running Database Migrations

A migration is **only needed when `server/prisma/schema.prisma` changes** — i.e. when the database structure itself is modified. Pure frontend changes (adding a feature to `featureRegistry.ts`, updating types, changing components) never require a migration.

### When to migrate

| Change type                                       | Migrate?                                    |
| ------------------------------------------------- | ------------------------------------------- |
| Add a field/model/index to `schema.prisma`        | **Yes**                                     |
| Remove or rename a field/model in `schema.prisma` | **Yes**                                     |
| Add a new param to `featureRegistry.ts` only      | No — stored inside the `config` JSON column |
| Change server route logic or middleware           | No                                          |
| Add/update React components or pages              | No                                          |
| Update environment variables or secrets           | No                                          |

> **Tip:** If the new feature stores its value inside the existing `config` JSON field on the `Configuration` model (which is the case for all SunnyPilot/Comma AI params), no schema change is needed — just update `featureRegistry.ts` and `config.ts` (the `SPConfig` interface + `createDefaultConfig()`) as described above.
>
> A schema change is only required when you need a **new top-level column or table** — for example, adding a new model, a new scalar field directly on a model, or a new relation.

### Dev environment (Docker)

```bash
# 1. Edit server/prisma/schema.prisma
# 2. Apply the migration and regenerate the Prisma client:
npm run docker:dev:migrate
# When prompted, enter a short descriptive name, e.g. "add_vehicle_trim_field"
```

The command runs `prisma migrate dev` inside the running server container, creates a new timestamped SQL file under `server/prisma/migrations/`, and regenerates the TypeScript client automatically.

### Prod environment (Docker)

```bash
# Prod uses prisma migrate deploy (safe — never resets data, no prompt):
npm run docker:prod:migrate
```

This is also run automatically every time the prod stack starts (`docker:prod:up`), so in most cases you only need it when applying a migration to an already-running prod stack without a full restart.

### Local development (no Docker)

```bash
cd server
npx prisma migrate dev --name describe_your_change
# The Prisma client is regenerated automatically after the migration
```

### After migrating

- The updated Prisma client types are available immediately in the server code.
- Restart the server (`npm run dev:server` or `docker:dev:restart`) if it was already running and didn't pick up hot reload.
- Commit the new migration file in `server/prisma/migrations/` — it is part of the source code and must be version-controlled.

---

## Security

### Admin secret — bcrypt hashing

**Recommended approach** — store a bcrypt hash instead of the plain-text secret so a leaked env file does not expose the password.

```bash
# Generate the hash once (cost factor 12)
cd server
npm run hash-secret -- "your-chosen-admin-password"
# Outputs something like: $2b$12$xxxxxxxxxxxxxxxxxxx
```

Then in your `.env`:

```env
# Recommended: bcrypt hash (plaintext never stored)
ADMIN_SECRET_HASH=$2b$12$xxxxxxxxxxx...

# Legacy fallback: plaintext (still timing-safe, but less secure)
# ADMIN_SECRET=your-chosen-admin-password
```

The middleware checks `ADMIN_SECRET_HASH` first. If it is set the `ADMIN_SECRET` variable is ignored. Both behave identically for the admin UI — just type the plain-text password in the browser prompt.

### Admin IP allowlist

Restrict admin panel access to specific IP addresses (e.g. your home/office IP):

```env
# Comma-separated, no spaces
ADMIN_ALLOWED_IPS=XX.XX.XX,XX.XX.XX
```

When unset, any IP can attempt authentication (still protected by rate-limit + secret).

### Token revocation

A user can invalidate their current bearer token and issue a fresh one via the header key-icon → **Regenerate token**. This immediately signs out all other devices using the old token. Use it if a token is leaked.

---

## Config Import / Export

Every config can be round-tripped as a `.sunnytune.json` file — useful for sharing outside the app, version-controlling your tuning, or migrating between SunnyTune instances.

**Export** — click the download icon on any ConfigCard or use the **Export** button in the configurator toolbar. A JSON file is saved locally.

**Import** — click **Import JSON** in the configurator toolbar (or on the My Configs page). Two formats are accepted:

- **SunnyTune** (`.sunnytune.json`) — the app's own export format; validated against the full schema before loading.
- **SunnyLink v2** (`.json`) — the raw parameter export produced by the SunnyLink mobile app directly from your Comma device. SunnyTune translates all known SP/OP parameters into `SPConfig` fields automatically, including the active driving model (`ModelManager_ActiveBundle` → displayed as e.g. `WMI V12 (January 13, 2026)`).

The SunnyTune export format:

```json
{
  "exportVersion": 1,
  "exportedAt": "2026-04-01T00:00:00.000Z",
  "name": "My Honda Config",
  "description": "...",
  "vehicleMake": "honda",
  "vehicleModel": "Civic",
  "vehicleYear": 2023,
  "tags": ["highway", "smooth"],
  "category": "daily-driver",
  "config": { ... }
}
```

---

## QR Code Sharing

When a config is shared successfully, the Share modal displays a **QR code** generated from the public URL. Scan it with any device (including your Comma device's browser) to instantly open the config. The QR code is generated client-side using `qrcode.react` — no external service call.

---

## Verified Vehicle List

The server maintains a curated list of vehicles supported by SunnyPilot/OpenPilot in `server/src/lib/vehicles.ts`. It covers 18+ makes and 200+ models.

- The list is exposed via `GET /api/explore/vehicles` and used as autocomplete data for the vehicle make/model selector.
- The `other` make entry is intentionally empty — it acts as a catch-all for unlisted vehicles.
- To add a new vehicle: add an entry to `VERIFIED_VEHICLES` in `vehicles.ts` and it will immediately appear in the client picker (no migration needed — the list is not stored in the database).

---

## SP Version Compatibility Filter

The Explore page has a **Min SP Version** filter. Enter a version string (e.g. `0.9.8`) to show only configs whose `metadata.sunnypilotVersion` is an exact match or higher (semver order). Leave the field blank to show all versions.

---

## Community Features

Every shared config supports a set of social and community interactions:

| Feature         | Who can use                        | Visible to        | Notes                                                                               |
| --------------- | ---------------------------------- | ----------------- | ----------------------------------------------------------------------------------- |
| **Likes**       | Any authenticated user             | Everyone          | One like per user per config; count updates in real-time; owner gets a notification |
| **Ratings**     | Any authenticated user (not owner) | Everyone          | 1–5 stars; upsert — you can change your rating                                      |
| **Comments**    | Any authenticated user             | Everyone          | Threaded replies up to 2 levels; owner can delete any comment on own config         |
| **Favorites**   | Any authenticated user             | Only you          | Private bookmark; stored per user                                                   |
| **Collections** | Any authenticated user             | Public or private | Named groups of configs; toggle public/private                                      |
| **Reports**     | Any authenticated user             | Admins only       | Flag a config or comment for moderation review                                      |

All social counts (`likeCount`, `ratingCount`, `commentCount`, `cloneCount`, `viewCount`) are returned on every config record from the explore, configs, and favorites endpoints.

---

## Configuration Sharing

1. Open any saved config and click **Share**.
2. A unique share link is generated: `/shared/<token>`.
3. Anyone with the link can view the config and leave ratings, comments, and likes.
4. Click **Clone** to create your own editable copy of any shared config.
5. After sharing you can continue editing and saving — each save increments the version counter. The public share URL always reflects the latest version.

---

## Deploying Online (Vercel — Frontend & Backend)

Both the frontend and backend run on **Vercel** — completely free, no credit card required, no sleep or cold-start issues.

- **Frontend:** existing `client/` Vercel project (unchanged)
- **Backend:** a second Vercel project pointing at the `server/` directory, running as a serverless Node.js function via `@vercel/node`

```
Browser → Vercel (client/) → /api/* rewrite → Vercel (server/) → Neon PostgreSQL
```

### One-time setup

**1. Deploy the backend to Vercel**

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import this GitHub repo.
2. On the configuration screen set **Root Directory** to `server`.
3. Leave the framework preset as **Other** (Node.js auto-detected).
4. Set all required environment variables before clicking Deploy:

| Variable            | Value                                                                   |
| ------------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`      | `postgresql://USER:PASSWORD@HOST/DB?sslmode=require`                    |
| `NODE_ENV`          | `production`                                                            |
| `PORT`              | `3001`                                                                  |
| `TOKEN_SECRET`      | _(run `openssl rand -hex 32` to generate)_                              |
| `ADMIN_SECRET_HASH` | _(run `cd server && npm run hash-secret -- "your-secret"` to generate)_ |
| `CORS_ORIGIN`       | `https://YOUR_FRONTEND.vercel.app`                                      |

5. Click **Deploy** — note the backend URL (e.g. `https://sunny-tune-server.vercel.app`).

**2. Update the frontend rewrite**

Update the `/api` rewrite destination in `client/vercel.json` to your backend URL:
```json
{
  "source": "/api/(.*)",
  "destination": "https://your-backend.vercel.app/api/$1"
}
```
Push to `main` — the frontend auto-redeploys.

**3. Add GitHub secrets for auto-deploy**

In your repo: **Settings → Secrets and variables → Actions**

| Type   | Name                         | Value                                          |
| ------ | ---------------------------- | ---------------------------------------------- |
| Secret | `VERCEL_TOKEN`               | Vercel personal access token                   |
| Secret | `VERCEL_ORG_ID`              | Team ID from `server/.vercel/project.json`     |
| Secret | `VERCEL_BACKEND_PROJECT_ID`  | Project ID from `server/.vercel/project.json`  |
| Secret | `VERCEL_FRONTEND_PROJECT_ID` | Project ID from `client/.vercel/project.json`  |

Once set, every push to `main` triggers the `deploy.yml` workflow automatically — smart path filtering means it only deploys the backend if `server/**` changed, and only the frontend if `client/**` changed. You can also trigger a manual deploy of either or both from the GitHub Actions tab.

### Database migrations

The `postinstall` script in `server/package.json` runs `prisma generate` automatically during every Vercel build. To apply a new schema migration against the hosted Neon DB:

```bash
cd server
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require" \
npx prisma migrate deploy
```

### Manual redeploy

```bash
# Backend
cd server && vercel --prod

# Frontend
cd client && vercel --prod
```
Or: GitHub → Actions → **Deploy** → Run workflow → choose `backend`, `frontend`, or `both`.

---

## GitHub Actions Workflows

Nine workflows live in `.github/workflows/`:

| Workflow              | File                    | Trigger                      | What it does                                                                           |
| --------------------- | ----------------------- | ---------------------------- | -------------------------------------------------------------------------------------- |
| **CI**                | `ci.yml`                | Push / PR to `main`          | Installs deps, runs all tests (server + client), type-checks, builds both packages     |
| **CodeQL**            | `codeql.yml`            | Push / PR / weekly           | GitHub code scanning — static analysis for JS/TS security vulnerabilities              |
| **Deploy**            | `deploy.yml`            | Push to `main` / manual      | Smart path-based deploy: backend → Vercel when `server/**` changes; frontend → Vercel when `client/**` changes. Manual trigger deploys either or both. Requires 4 GitHub secrets (see below). |
| **Lighthouse**        | `lighthouse.yml`        | PR to `main`                 | Runs Lighthouse CI against the PR preview; posts performance scores as a status check  |
| **Dependency Review** | `dependency-review.yml` | PR to `main`                 | Blocks PRs that introduce dependencies with known CVEs                                 |
| **Secret Scan**       | `secret-scan.yml`       | Push / PR                    | Scans commit diff for accidentally committed secrets/tokens                            |
| **PR Labeler**        | `pr-labeler.yml`        | PR opened / edited           | Automatically applies labels (`client`, `server`, `docs`, etc.) based on changed paths |
| **Stale**             | `stale.yml`             | Daily schedule               | Marks issues and PRs stale after 60 days of inactivity; closes after 7 more days       |
| **Create Labels**     | `create-labels.yml`     | Manual (`workflow_dispatch`) | Creates all standard labels used by the PR labeler — run once after making repo public |

---

## Project Structure

```
sunny-tune/
├── client/                         # React + Vite frontend
│   ├── src/
│   │   ├── api/                    # Axios API client + admin API
│   │   ├── components/
│   │   │   ├── config/sections/    # One component per config section
│   │   │   │   ├── SunnyLinkExportModal.tsx  # SunnyLink device export with validation
│   │   │   │   └── ...             # Other config modals / shared config card
│   │   │   ├── layout/             # Header, Layout
│   │   │   └── ui/                 # Button, Modal, Badge, HelpTooltip, etc.
│   │   ├── lib/
│   │   │   ├── featureRegistry.ts        # ← Add new SP/Comma AI params here
│   │   │   ├── fieldHelp.ts             # ← Register tooltip help text for each spKey
│   │   │   ├── sunnyLinkValidation.ts   # SunnyLink export pre-flight validation rules
│   │   │   └── configExport.ts          # JSON + SunnyLink import/export logic
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── ConfiguratorPage.tsx
│   │   │   ├── ExplorePage.tsx
│   │   │   ├── MyConfigsPage.tsx
│   │   │   ├── SharedConfigPage.tsx
│   │   │   ├── CollectionDetailPage.tsx  # Collection item management
│   │   │   ├── DashboardPage.tsx   # Stats & charts dashboard
│   │   │   ├── AdminPage.tsx
│   │   │   ├── ChangelogPage.tsx   # Version changelog timeline
│   │   │   ├── DocsPage.tsx        # In-app documentation
│   │   │   └── AboutPage.tsx
│   │   ├── store/                  # Zustand stores (auth, config)
│   │   ├── types/                  # Shared TypeScript types (SPConfig, etc.)
│   │   └── __tests__/              # Vitest + React Testing Library tests
│   ├── Dockerfile                  # Multi-stage production build
│   └── Dockerfile.dev              # Dev image (hot reload via bind mounts)
├── server/                         # Express + Prisma backend
│   ├── prisma/
│   │   └── schema.prisma           # ← Database schema (edit then run migrate)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── vehicles.ts         # Verified SunnyPilot vehicle list
│   │   │   ├── querySchemas.ts     # Shared Zod schemas for query params
│   │   │   ├── guards.ts           # Type-guard helpers
│   │   │   ├── logger.ts           # Structured request logger
│   │   │   └── sanitize.ts         # Input sanitization utilities
│   │   ├── middleware/             # auth, adminAuth, errorHandler, pageView, rateLimiter
│   │   ├── routes/
│   │   │   ├── configs.ts          # Config CRUD
│   │   │   ├── explore.ts          # Public explore/search
│   │   │   ├── community.ts        # Ratings & comments
│   │   │   ├── likes.ts            # Likes
│   │   │   ├── collections.ts      # Collections CRUD
│   │   │   ├── favorites.ts        # Favorites
│   │   │   ├── notifications.ts    # In-app notifications
│   │   │   ├── reports.ts          # User reports
│   │   │   ├── users.ts            # User registration & token management
│   │   │   ├── admin.ts            # Admin panel API
│   │   │   └── index.ts            # Router aggregator
│   │   └── __tests__/              # Server unit + integration tests
│   ├── Dockerfile                  # Multi-stage production build
│   └── Dockerfile.dev              # Dev image
├── .github/
│   └── workflows/                  # CI, Deploy, CodeQL, Lighthouse, etc.
├── docker-compose.yml              # Production compose
├── docker-compose.dev.yml          # Development compose (hot reload)
├── .env.example                    # Template — copy to .env (Docker) or server/.env (local)
└── package.json                    # Root monorepo scripts (see Scripts Reference)
```
