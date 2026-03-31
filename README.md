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
  - [Configuration Sharing](#configuration-sharing)
  - [Deploying to Vercel](#deploying-to-vercel)
  - [Project Structure](#project-structure)

# SunnyTune ☀️

> _Fine-tune your SunnyPilot. Share. Drive chill._

A community web application for creating, storing, and sharing [SunnyPilot](https://www.sunnypilot.ai/) and [Comma AI](https://comma.ai/) openpilot configurations. Build fully-detailed configs through a structured UI covering all SunnyPilot parameters — lateral/longitudinal control, speed limiting, lane changes, navigation, UI settings, Comma AI core options, and advanced tuning.

Configs can be shared via a unique URL and are locked read-only once published, ensuring shared configs remain immutable.

---

## Stack

| Layer     | Technology                              |
| --------- | --------------------------------------- |
| Frontend  | React 18 + TypeScript + Vite 5          |
| Styling   | Tailwind CSS (dark zinc theme)          |
| Icons     | Lucide React                            |
| State     | Zustand + TanStack Query                |
| Backend   | Node.js + Express + TypeScript          |
| ORM       | Prisma 5 (see below)                    |
| Database  | PostgreSQL 16                           |
| Auth      | Bearer token (UUID, no password)        |
| Container | Docker + Docker Compose                 |
| Testing   | Vitest + @testing-library/react         |
| Deploy    | Vercel (frontend) + any Node host       |

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

| Script | What it does |
|---|---|
| `npm run dev` | Starts **both** the Express server (port 3001) and the Vite client (port 5173) concurrently with hot reload |
| `npm run dev:server` | Starts only the Express backend with `tsx watch` |
| `npm run dev:client` | Starts only the Vite frontend dev server |
| `npm run build` | Compiles the TypeScript server (`tsc`) then builds the Vite client bundle |

### Testing

| Script | What it does |
|---|---|
| `npm test` | Runs **all** tests — server (Vitest/Node) then client (Vitest/jsdom) |
| `npm run test:server` | Runs only the server-side tests |
| `npm run test:client` | Runs only the client-side tests (React Testing Library) |

Tests live in `__tests__/` directories next to the code they test. All 46 tests must pass — Docker builds will also fail if tests fail.

### Docker — Development (`docker-compose.dev.yml`)

Dev containers use hot reload: source files are bind-mounted so changes take effect without rebuilding. Project name: `sp-dev`.

| Script | What it does |
|---|---|
| `npm run docker:dev:build` | Builds the dev Docker images (runs tests during build — fails fast on test failures) |
| `npm run docker:dev:up` | Starts the full dev stack (DB + server + client) in the **foreground** — logs stream to your terminal |
| `npm run docker:dev:up:d` | Starts the dev stack in the **background** (detached mode) |
| `npm run docker:dev:down` | Stops and removes all dev containers (database data is preserved) |
| `npm run docker:dev:down:v` | Stops containers **and wipes the database volume** — gives you a completely fresh DB on next start |
| `npm run docker:dev:restart` | Restarts all running dev services without rebuilding |
| `npm run docker:dev:logs` | Tails the live logs from all dev containers (Ctrl+C to exit) |
| `npm run docker:dev:upgrade` | Pulls the latest base images, rebuilds all services, and restarts them — useful for keeping base images up-to-date |
| `npm run docker:dev:shell:server` | Opens an interactive shell (`sh`) **inside the running server container** |
| `npm run docker:dev:shell:db` | Opens a `psql` session **inside the running database container** |
| `npm run docker:dev:migrate` | Runs `prisma migrate dev` inside the server container — use this after changing `schema.prisma` |
| `npm run docker:dev:studio` | Starts Prisma Studio inside the container — opens a database browser at **http://localhost:5555** |

Dev URLs: **http://localhost:5173** (client) · **http://localhost:3001** (API)

### Docker — Production (`docker-compose.yml`)

Prod containers use multi-stage builds (smaller images, no dev dependencies). Prisma migrations run automatically on container start. Project name: `sp-prod`.

| Script | What it does |
|---|---|
| `npm run docker:prod:build` | Builds the production Docker images (runs tests during build) |
| `npm run docker:prod:up` | Starts the full prod stack in the background and runs `prisma migrate deploy` automatically |
| `npm run docker:prod:down` | Stops and removes all prod containers |
| `npm run docker:prod:down:v` | Stops prod containers **and wipes the database volume** |
| `npm run docker:prod:restart` | Restarts prod services |
| `npm run docker:prod:logs` | Tails live logs from prod containers |
| `npm run docker:prod:upgrade` | Pulls latest base images, rebuilds prod, and performs a rolling restart |
| `npm run docker:prod:shell:server` | Shell inside the running prod server container |
| `npm run docker:prod:shell:db` | `psql` session inside the prod database container |
| `npm run docker:prod:migrate` | Runs `prisma migrate deploy` inside the prod server (safe for production — never resets data) |
| `npm run docker:prod:studio` | Prisma Studio against the prod database at **http://localhost:5555** |

Prod URL: **http://localhost** (port 80 by default; set `CLIENT_PORT` in your `.env` to change it)

> **Dev + prod can run simultaneously** — they use separate Docker project names (`sp-dev` / `sp-prod`), separate networks, and separate database volumes.

> **Dev and prod databases are completely isolated.**
> Dev uses the `postgres_dev_data` volume; prod uses `postgres_data`. They have no shared storage, network, or containers — wiping dev with `docker:dev:down:v` has zero effect on prod.

---

## Quick Start — Docker (recommended)

### 1. Create the root `.env` file

```bash
cd /path/to/sp-configurator
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
ADMIN_SECRET=replace_me
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

Access the admin panel at `/admin`. You'll be prompted for the `ADMIN_SECRET` value set in your environment.

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

| Value | Meaning | When to use |
|---|---|---|
| `'sunnypilot'` | Exclusive to the SP fork | Params with `SP_*` prefix, SP-only behaviour |
| `'openpilot'` | Stock Comma AI / upstream openpilot | Params that exist in vanilla openpilot |

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

## Configuration Sharing

1. Open any saved config and click **Share**.
2. A unique share link is generated: `/shared/<token>`.
3. The config becomes **permanently read-only** — no further edits are possible.
4. Anyone with the link can view the config and leave ratings/comments.
5. Click **Clone** to create your own editable copy of any shared config.

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
sp-configurator/
├── client/                         # React + Vite frontend
│   ├── src/
│   │   ├── api/                    # Axios API client + admin API
│   │   ├── components/
│   │   │   ├── config/sections/    # One component per config section
│   │   │   ├── layout/             # Header, Layout, Footer
│   │   │   └── ui/                 # Button, Modal, Badge, etc.
│   │   ├── lib/
│   │   │   └── featureRegistry.ts  # ← Add new SP/Comma AI params here
│   │   ├── pages/                  # Route-level pages
│   │   ├── store/                  # Zustand stores (auth, config)
│   │   ├── types/                  # Shared TypeScript types (SPConfig, etc.)
│   │   └── __tests__/              # Vitest + React Testing Library tests
│   ├── Dockerfile                  # Multi-stage production build
│   └── Dockerfile.dev              # Dev image (hot reload via bind mounts)
├── server/                         # Express + Prisma backend
│   ├── prisma/
│   │   └── schema.prisma           # ← Database schema (edit then run migrate)
│   ├── src/
│   │   ├── middleware/             # auth, adminAuth, pageView, rateLimiter
│   │   ├── routes/                 # REST API route handlers
│   │   └── __tests__/              # Server unit + integration tests
│   ├── Dockerfile                  # Multi-stage production build
│   └── Dockerfile.dev              # Dev image
├── docker-compose.yml              # Production compose
├── docker-compose.dev.yml          # Development compose (hot reload)
├── .env.example                    # Template — copy to server/.env
└── package.json                    # Root monorepo scripts (see Scripts Reference)
```
