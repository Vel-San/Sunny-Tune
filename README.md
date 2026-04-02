<!-- BADGES — replace YOUR_USERNAME/sunny-tune with your GitHub handle/repo name -->

[![CI](https://github.com/YOUR_USERNAME/sunny-tune/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/sunny-tune/actions/workflows/ci.yml)
[![CodeQL](https://github.com/YOUR_USERNAME/sunny-tune/actions/workflows/codeql.yml/badge.svg)](https://github.com/YOUR_USERNAME/sunny-tune/actions/workflows/codeql.yml)
[![Lighthouse](https://github.com/YOUR_USERNAME/sunny-tune/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/YOUR_USERNAME/sunny-tune/actions/workflows/lighthouse.yml)
[![Node.js](https://img.shields.io/badge/node-20%2B-brightgreen?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docs.docker.com/compose/)
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
  - [Admin Panel](#admin-panel)
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
    - [Token revocation](#token-revocation)
    - [Content-Security-Policy](#content-security-policy)
    - [Input validation](#input-validation)
  - [Config Import / Export](#config-import--export)
  - [Config Diff Viewer](#config-diff-viewer)
  - [Config Version History](#config-version-history)
  - [Config Collections / Playlists](#config-collections--playlists)
  - [QR Code Sharing](#qr-code-sharing)
  - [Trending This Week](#trending-this-week)
  - [Verified Vehicle List](#verified-vehicle-list)
  - [Dashboard](#dashboard)
  - [SP Version Compatibility Filter](#sp-version-compatibility-filter)
  - [Favorites / Bookmarks](#favorites--bookmarks)
  - [Configuration Sharing](#configuration-sharing)
  - [Deploying to Vercel](#deploying-to-vercel)
  - [Project Structure](#project-structure)

# SunnyTune ☀️

> _Fine-tune your SunnyPilot. Share. Drive chill._

A community web application for creating, storing, and sharing [SunnyPilot](https://www.sunnypilot.ai/) and [Comma AI](https://comma.ai/) openpilot configurations. Build fully-detailed configs through a structured UI covering all SunnyPilot parameters — lateral/longitudinal control, speed limiting, lane changes, navigation, UI settings, Comma AI core options, and advanced tuning.

Configs can be shared via a unique URL and are locked read-only once published, ensuring shared configs remain immutable.

> **Contributing?** See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide — setup, code style, how to add SP parameters, PR process, and more.
> **Security?** See [SECURITY.md](SECURITY.md) for the responsible disclosure process and architecture overview.

---

## ⚠️ Before Making This Repo Public

Run through this checklist **before** flipping the repo from private → public.

<details>
<summary>Click to expand the pre-public security checklist</summary>

### 1. Scan git history for leaked secrets

Even if your `.env` is in `.gitignore`, secrets can leak via accidental commits. Run locally:

```bash
# Install gitleaks (macOS: brew install gitleaks)
gitleaks detect --source . --log-opts="--all" --verbose

# Or scan with trufflehog
npx trufflehog git file://. --only-verified
```

If anything is found, **rotate the secret immediately** before making the repo public (changing the env var is not enough — the history must be cleaned with `git filter-repo` or BFG).

### 2. Verify nothing sensitive is committed

```bash
# Check .env files are NOT tracked
git ls-files | grep -E "\.env$|\.env\."

# Check for common secret patterns
git log --all -p | grep -iE "(secret|password|token|api_key|private_key)\s*=\s*.{8,}"
```

Expected output: **nothing**. Your `.gitignore` already excludes `.env*` files, but double-check.

### 3. Set up GitHub Actions secrets

Your CI workflows need these repository secrets (Settings → Secrets and variables → Actions):

| Secret                          | Required by                               | How to generate                                                                                      |
| ------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| _(none required for CI to run)_ | `ci.yml`, `codeql.yml`, `secret-scan.yml` | —                                                                                                    |
| `LHCI_GITHUB_APP_TOKEN`         | `lighthouse.yml`                          | Optional — install the [LHCI GitHub App](https://github.com/apps/lighthouse-ci) for PR status checks |

> The CI workflow uses only `GITHUB_TOKEN` (auto-provided) — no secrets needed for tests/build to run.

### 4. Review all environment variable defaults

Check `.env.example` — ensure every value is clearly a placeholder (no real passwords, tokens, or IPs):

```bash
cat .env.example   # should contain only "change_me" / "replace_me" values
```

Current `.env.example` looks safe ✅ — but re-verify if you've edited it since.

### 5. Add a LICENSE file

Open source repos need a licence. Choose one at [choosealicense.com](https://choosealicense.com/) and add a `LICENSE` file to the repo root. MIT is a common choice for community tools.

```bash
# Example: MIT licence
curl -s "https://api.github.com/licenses/mit" | python3 -c "import sys,json; print(json.load(sys.stdin)['body'])" > LICENSE
# Edit the year and author name in the file
```

### 6. Update the README badges

Replace `YOUR_USERNAME/sunny-tune` in the badge URLs at the top of this file with your actual GitHub username and repo name.

### 7. Enable GitHub security features

In your repo settings, enable:

- **Dependabot alerts** — automatically notifies you of vulnerable dependencies
- **Dependabot security updates** — auto-PRs for vulnerable deps
- **Secret scanning** — GitHub scans all commits for known secret patterns
- **Code scanning** — the CodeQL workflow already sets this up once it runs

### 8. Protect the `main` branch

Settings → Branches → Add branch ruleset for `main`:

- ✅ Require a pull request before merging
- ✅ Require status checks to pass (CI, CodeQL, Secret Scan)
- ✅ Require branches to be up to date before merging
- ✅ Restrict force pushes

### 9. Run the "Create Labels" workflow

After pushing, go to Actions → **Create Labels** → Run workflow. This creates all the labels used by the PR labeler and stale workflows.

</details>

---

## Stack

| Layer       | Technology                        |
| ----------- | --------------------------------- |
| Layer       | Technology                        |
| ----------- | --------------------------------- |
| Frontend    | React 18 + TypeScript + Vite 5    |
| Styling     | Tailwind CSS (dark zinc theme)    |
| Icons       | Lucide React                      |
| State       | Zustand + TanStack Query          |
| QR Codes    | react-qr-code (pure SVG)          |
| Backend     | Node.js + Express + TypeScript    |
| ORM         | Prisma 5 (see below)              |
| Database    | PostgreSQL 16                     |
| Auth        | Bearer token (UUID, no password)  |
| Container   | Docker + Docker Compose           |
| Testing     | Vitest + @testing-library/react   |
| Deploy      | Vercel (frontend) + any Node host |

---

## What is Prisma?

**Prisma** is a type-safe ORM (Object-Relational Mapper) for Node.js. Instead of writing raw SQL, you define your database schema in `server/prisma/schema.prisma` and Prisma generates a fully-typed client that lets you interact with PostgreSQL using plain TypeScript objects.

Key things Prisma handles for this project:

- **Schema** — `schema.prisma` is the single source of truth for the database structure (users, configurations, ratings, comments, page views)
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
| `npm run docker:dev:up`           | Starts the full dev stack (DB + server + client) in the **foreground** — logs stream to your terminal              |
| `npm run docker:dev:up:d`         | Starts the dev stack in the **background** (detached mode)                                                         |
| `npm run docker:dev:down`         | Stops and removes all dev containers (database data is preserved)                                                  |
| `npm run docker:dev:down:v`       | Stops containers **and wipes the database volume** — gives you a completely fresh DB on next start                 |
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

| Script                             | What it does                                                                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------- |
| `npm run docker:prod:build`        | Builds the production Docker images (runs tests during build)                                 |
| `npm run docker:prod:up`           | Starts the full prod stack in the background and runs `prisma migrate deploy` automatically   |
| `npm run docker:prod:down`         | Stops and removes all prod containers                                                         |
| `npm run docker:prod:down:v`       | Stops prod containers **and wipes the database volume**                                       |
| `npm run docker:prod:restart`      | Restarts prod services                                                                        |
| `npm run docker:prod:logs`         | Tails live logs from prod containers                                                          |
| `npm run docker:prod:upgrade`      | Pulls latest base images, rebuilds prod, and performs a rolling restart                       |
| `npm run docker:prod:shell:server` | Shell inside the running prod server container                                                |
| `npm run docker:prod:shell:db`     | `psql` session inside the prod database container                                             |
| `npm run docker:prod:migrate`      | Runs `prisma migrate deploy` inside the prod server (safe for production — never resets data) |
| `npm run docker:prod:studio`       | Prisma Studio against the prod database at **http://localhost:5555**                          |

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
DATABASE_URL="postgresql://postgres:changeme@localhost:5432/spconfigurator"
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
POSTGRES_PASSWORD=replace_me
TOKEN_SECRET=replace_me
# Use ADMIN_SECRET_HASH (bcrypt) for production — see Security section below
ADMIN_SECRET_HASH=replace_me_with_bcrypt_hash
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:3001
CLIENT_PORT=80          # port to expose the frontend on
```

---

## Authentication

SunnyTune uses **anonymous UUID tokens** — no sign-up or password required.

- On first visit, the client auto-calls `POST /api/users/register` which returns a `sp_<uuid>` token.
- The token is stored in `localStorage` under `sp_user_token` and sent as `Authorization: Bearer sp_...` on every request.
- To switch to a different user: DevTools → Application → Local Storage → delete `sp_user_token` → refresh.
- To view your token: click the key icon in the header, or run `localStorage.getItem('sp_user_token')` in the browser console.

---

## Admin Panel

Access the admin panel at `/admin`. You'll be prompted for the `ADMIN_SECRET` (or the plain-text value behind `ADMIN_SECRET_HASH`) value set in your environment.

The secret is stored only in `sessionStorage` (cleared automatically when the browser tab closes — never in `localStorage`).

Admin panel features:

- **Dashboard** — total users, configs, ratings, comments, page views, engagement trends
- **Users** — list all users with config counts, view details, delete accounts
- **Configurations** — browse all configs, filter by shared, force-unshare, delete
- **Activity** — page view analytics broken down by path and day

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

The UI reads `source` to badge each parameter as **SP** or **Comma AI** in the configurator.

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

1. Add the field to `SPConfig` in `client/src/types/config.ts`
2. Add the field + default value to `DEFAULT_CONFIG` in `client/src/store/configStore.ts`
3. For dynamically-rendered sections the `<ParamRow>` is auto-generated from the registry
4. For manually-laid-out sections (e.g. `VehicleSection`), add a `<ParamRow>` in the component

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

> **Tip:** If the new feature stores its value inside the existing `config` JSON field on the `Configuration` model (which is the case for all SunnyPilot/Comma AI params), no schema change is needed — just update `featureRegistry.ts`, `config.ts`, and `configStore.ts` as described above.
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
ADMIN_ALLOWED_IPS=203.0.113.10,198.51.100.42
```

When unset, any IP can attempt authentication (still protected by rate-limit + secret).

### Token revocation

A user can invalidate their current bearer token and issue a fresh one via the header key-icon → **Regenerate token**. This immediately signs out all other devices using the old token. Use it if a token is leaked.

### Content-Security-Policy

- **API server** (Helmet): `default-src 'none'; frame-ancestors 'none'` — the API serves only JSON, so no sources are allowed at all.
- **Frontend** (nginx): full CSP covering `default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, and `base-uri 'self'`. Inline styles are allowed (`unsafe-inline`) because Tailwind generates them at build time.

### Input validation

- All JSON request bodies are validated with **Zod** before reaching handler logic.
- All query parameters (`page`, `limit`, `sort`, `q`, `year`, `days`, etc.) are coerced and range-checked; invalid params return `400` with a field-error breakdown.
- Free-text fields (`name`, `description`, `tags`, `comments`) have C0/C1 control characters stripped server-side before storage.
- The `config` JSON field rejects payloads with unknown top-level section keys.

---

## Config Import / Export

Every config can be round-tripped as a `.sunnytune.json` file — useful for sharing outside the app, version-controlling your tuning, or migrating between SunnyTune instances.

**Export** — click the download icon on any ConfigCard or use the **Export** button in the configurator toolbar. A JSON file is saved locally.

**Import** — click **Import JSON** in the configurator toolbar (or on the My Configs page). The file is validated against the expected schema before loading; a clear error is shown if anything doesn't match.

The export format:

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

## Config Diff Viewer

When viewing a shared config that was cloned from another public config, a **View diff from original** button appears. Clicking it opens a modal listing every parameter that differs between the clone and its source — grouped by section, showing old → new values with human-readable labels from the feature registry.

A **Config Compare** mode is also available on the My Configs page: click the compare icon to enter compare mode, select two configs, then click **View Diff** to open the same diff modal between any two of your own configs.

---

## Config Version History

Every time you save an existing config, SunnyTune automatically snapshots the previous state before overwriting it. This gives you a full version history.

- The snapshot is stored in the `config_snapshots` table with an auto-incrementing `version` number.
- Up to **20 snapshots** per config are retained; older ones are pruned automatically.
- Access history via the **History** (clock) button in the configurator's top bar.
- From the history modal you can **Diff** any snapshot against the current state (same diff viewer), or **Restore** it (loads into the editor — you still need to Save to persist).

Relevant API endpoints:

```
GET  /api/configs/:id/history            → list of { id, version, name, createdAt }
GET  /api/configs/:id/history/:snapshotId → full snapshot including config JSON
```

---

## Config Collections / Playlists

Collections let you organise related configs into named playlists (e.g. "Highway builds", "E2E experiments").

- Create, rename, and delete collections from the **Collections** tab on the My Configs page.
- Each collection can be toggled **Public** (accessible via URL without auth) or private.
- Add or remove configs from a collection's detail page (`/collections/:id`).
- A config can appear in multiple collections.

Relevant API endpoints:

```
GET    /api/collections              → list your collections
POST   /api/collections              → create { name, description?, isPublic }
GET    /api/collections/:id          → detail with items
PUT    /api/collections/:id          → update
DELETE /api/collections/:id          → delete
POST   /api/collections/:id/items    → add config { configId }
DELETE /api/collections/:id/items/:configId
```

---

## QR Code Sharing

When a config is shared successfully, the Share modal displays a **QR code** generated from the public URL. Scan it with any device (including your Comma device's browser) to instantly open the config. The QR code is generated client-side using `react-qr-code` — no external service call.

---

## Trending This Week

The Explore page has a **Trending** sort option (selected by default). It ranks configs by a weighted score calculated over the past 7 days:

```
trendingScore = (ratings in last 7d × 5) + (clones in last 7d × 3) + log(viewCount + 1)
```

This surfaces recently-active configs over all-time leaders.

---

## Verified Vehicle List

The server maintains a curated list of vehicles supported by SunnyPilot/OpenPilot in `server/src/lib/vehicles.ts`. It covers 18+ makes and 200+ models.

- The list is exposed via `GET /api/explore/vehicles` and used as autocomplete data for the vehicle make/model selector.
- The `other` make entry is intentionally empty — it acts as a catch-all for unlisted vehicles.
- To add a new vehicle: add an entry to `VERIFIED_VEHICLES` in `vehicles.ts` and it will immediately appear in the client picker (no migration needed — the list is not stored in the database).

---

## Dashboard

The **Dashboard** page (`/dashboard`) gives you an at-a-glance view of your config stats and community activity:

- **Your Stats** — total configs, shared count, total views received, total clones received
- **Top Configs by Views** — bar chart of your 5 most-viewed configs
- **Lateral Method Distribution** — bar chart showing how many of your configs use Torque / PID / INDI / LQR
- **SP Branch Distribution** — breakdown of stable-sp vs dev-sp vs nightly across your configs
- **Community Stats** — total shared configs, ratings, comments, and unique makes platform-wide
- **Recently Updated** — your last 5 modified configs with version numbers

Charts are rendered with pure CSS (no charting library dependency).

---

## SP Version Compatibility Filter

The Explore page has a **Min SP Version** filter. Enter a version string (e.g. `0.9.8`) to show only configs whose `metadata.sunnypilotVersion` is an exact match or higher (semver order). Leave the field blank to show all versions.

---

## Favorites / Bookmarks

Any shared config can be saved to your personal favorites list:

- Click the **heart** icon on any explore card or shared config page to toggle a favorite.
- Your saved favorites appear under the **Favorites** tab on the My Configs page.
- Favorites do not clone or modify the original config — they are just a personal bookmark.
- Favoriting requires a registered (anonymous) session token.

---

## Configuration Sharing

1. Open any saved config and click **Share**.
2. A unique share link is generated: `/shared/<token>`.
3. Anyone with the link can view the config and leave ratings/comments.
4. Click **Clone** to create your own editable copy of any shared config.
5. After sharing you can continue editing and saving — each save increments the version counter. The public share URL always reflects the latest version.

---

## Deploying to Vercel

1. Push the repo to GitHub.
2. Import into Vercel — set the root directory to `client/`.
3. Add build env var: `VITE_API_URL=https://your-api.example.com`
4. Deploy the API separately (Railway, Render, Fly.io) with the same `server/.env` vars.
5. Update `vercel.json` rewrite destination to your API URL.

---

## Project Structure

```
sunny-tune/
├── client/                         # React + Vite frontend
│   ├── src/
│   │   ├── api/                    # Axios API client + admin API
│   │   ├── components/
│   │   │   ├── config/sections/    # One component per config section
│   │   │   ├── layout/             # Header, Layout, Footer
│   │   │   └── ui/                 # Button, Modal, Badge, etc.
│   │   ├── lib/
│   │   │   └── featureRegistry.ts  # ← Add new SP/Comma AI params here
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx   # Stats & charts dashboard
│   │   │   ├── ChangelogPage.tsx   # Version changelog timeline
│   │   │   ├── DocsPage.tsx        # In-app documentation
│   │   │   ├── CollectionDetailPage.tsx  # Collection item management
│   │   │   └── ...                 # Other route pages
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
│   │   │   └── querySchemas.ts     # Shared Zod schemas for query params
│   │   ├── middleware/             # auth, adminAuth, pageView, rateLimiter
│   │   ├── routes/
│   │   │   ├── collections.ts      # Collections CRUD
│   │   │   └── ...                 # configs, explore, community, etc.
│   │   └── __tests__/              # Server unit + integration tests
│   ├── Dockerfile                  # Multi-stage production build
│   └── Dockerfile.dev              # Dev image
├── docker-compose.yml              # Production compose
├── docker-compose.dev.yml          # Development compose (hot reload)
├── .env.example                    # Template — copy to server/.env
└── package.json                    # Root monorepo scripts (see Scripts Reference)
```
