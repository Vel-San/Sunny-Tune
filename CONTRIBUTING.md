# Contributing to SunnyTune ☀️

Thank you for wanting to make SunnyTune better! This document covers everything you need to know — from setting up your environment to getting a PR merged.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [I just have a question…](#i-just-have-a-question)
- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure at a Glance](#project-structure-at-a-glance)
- [Making Changes](#making-changes)
  - [Branching Strategy](#branching-strategy)
  - [Commit Messages](#commit-messages)
  - [Code Style](#code-style)
  - [Tests](#tests)
  - [TypeScript](#typescript)
- [Adding a New SunnyPilot / Comma AI Parameter](#adding-a-new-sunnypilot--comma-ai-parameter)
- [Adding a New Page or Route](#adding-a-new-page-or-route)
- [Database Schema Changes](#database-schema-changes)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Security Issues](#security-issues)

---

## Code of Conduct

Be kind, constructive, and welcoming. We are a small community of self-driving enthusiasts — assume good intent. Harassment of any kind will not be tolerated.

---

## I just have a question…

Please **do not open a GitHub issue for questions**. Instead:

- **SunnyPilot settings / behaviour** → [community.sunnypilot.ai](https://community.sunnypilot.ai/)
- **Comma AI / openpilot hardware** → [discord.comma.ai](https://discord.comma.ai/)
- **SunnyTune usage questions** → Open a [Discussion](../../discussions) on GitHub

---

## Ways to Contribute

| Contribution type               | Where to start                                                                |
| ------------------------------- | ----------------------------------------------------------------------------- |
| Fix a bug                       | [Open a Bug Report issue](../../issues/new?template=bug_report.yml)           |
| Suggest a feature               | [Open a Feature Request issue](../../issues/new?template=feature_request.yml) |
| Add a new SP/Comma AI parameter | [Open an SP Parameter issue](../../issues/new?template=sp_feature.yml)        |
| Improve documentation           | Edit any `*.md` file and send a PR                                            |
| Write tests                     | See the `__tests__/` directories                                              |
| Fix a typo / small improvement  | Just send a PR — no issue needed                                              |

---

## Development Setup

### Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org/)
- **Docker Desktop** (recommended) — [docker.com](https://www.docker.com/products/docker-desktop/)
- OR **PostgreSQL 16** if not using Docker

### Quick start

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/sunny-tune.git
cd sunny-tune

# 2. Install all workspace dependencies
npm install

# 3. Set up environment
cp .env.example server/.env
# Edit server/.env — at minimum set TOKEN_SECRET and ADMIN_SECRET
echo "VITE_API_URL=http://localhost:3001" > client/.env

# 4. Docker path (recommended)
npm run docker:dev:build      # builds images + runs all tests
npm run docker:dev:up:d       # starts DB + server + client
# App is live at http://localhost:5173

# 4. Non-Docker path
cd server && npx prisma migrate dev --name init && cd ..
npm run dev                   # hot-reloads both server + client
```

---

## Project Structure at a Glance

```
client/src/
  api/               ← Axios API client (fetchAllConfigs, fetchExplore, …)
  components/
    config/sections/ ← One component per configurator section
    ui/              ← Primitive UI components (Button, Modal, Slider…)
  lib/
    featureRegistry.ts  ← ALL SP/Comma AI parameters come from here
  pages/             ← Top-level route components
  store/             ← Zustand stores (auth, config)
  types/config.ts    ← SPConfig interface + all shared types

server/src/
  routes/            ← Express route handlers
  middleware/        ← auth, adminAuth, rateLimiter, pageView…
  config/database.ts ← Prisma client singleton
  prisma/
    schema.prisma    ← Database schema (edit → migrate)
```

---

## Making Changes

### Branching Strategy

| Branch                 | Purpose                                                  |
| ---------------------- | -------------------------------------------------------- |
| `main`                 | Production-ready code — protected, never commit directly |
| `dev`                  | Integration branch — PRs targeting `main` start here     |
| `feature/your-feature` | Your work — branch from `dev`                            |
| `fix/your-bug`         | Bug fixes — branch from `dev` (or `main` for hotfixes)   |

```bash
git checkout dev
git pull origin dev
git checkout -b feature/my-feature
```

### Commit Messages

We use a relaxed form of [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short summary>

[optional body]
[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

Good examples:

```
feat: add INDI lateral tuning parameters to registry
fix: clear authStore token only on 401, not network errors
docs: add CONTRIBUTING guide
test: add coverage for rateLimiter middleware
```

### Code Style

- **TypeScript everywhere** — no `any` unless absolutely unavoidable
- **Tailwind for styles** — no inline CSS, no CSS modules
- **Lucide icons** — source icons from `lucide-react` only
- **Server validation** — all request bodies validated with Zod before handler logic
- **No secrets in code** — credentials, tokens, and keys must live in environment variables

Run the TypeScript compiler to catch issues before committing:

```bash
cd server && npx tsc --noEmit && cd ../client && npx tsc --noEmit
```

### Tests

All PRs must keep the test suite green. Run tests with:

```bash
npm test              # all tests (server + client)
npm run test:server   # server only
npm run test:client   # client only (React Testing Library / jsdom)
```

**When to add tests:**

- New utility functions, middleware, or Zod schemas → unit test in `__tests__/`
- New complex UI logic or store mutations → component/store test
- Bug fixes → add a test that would have caught the bug

**Mocking Prisma:** All server tests mock the Prisma client via `vi.mock('../../config/database')` — no real database is needed.

### TypeScript

Both `server/` and `client/` must compile with zero errors before a PR can merge:

```bash
npx tsc --noEmit   # run in each workspace directory
```

---

## Adding a New SunnyPilot / Comma AI Parameter

This is the most common type of contribution. See the full guide in [README.md § Adding New SunnyPilot / Comma AI Features](README.md#adding-new-sunnypilot--comma-ai-features).

**Checklist:**

- [ ] Register the parameter in `client/src/lib/featureRegistry.ts` with all required fields (`id`, `section`, `label`, `description`, `type`, `default`, `source`)
- [ ] Add the field to `SPConfig` in `client/src/types/config.ts`
- [ ] Add the field + default to `DEFAULT_CONFIG` in `client/src/store/configStore.ts`
- [ ] If the section renders parameters dynamically (via `<ParamRow>`), no component change is needed. For manually-laid-out sections, add a `<ParamRow>` in the component
- [ ] Add a registry unit test if the parameter has unusual validation logic
- [ ] Link to the SP changelog entry or commit that introduced the parameter in your PR description

---

## Adding a New Page or Route

### Frontend (new page)

1. Create `client/src/pages/MyNewPage.tsx`
2. Add the route to `App.tsx` inside the `<Routes>` block
3. Add a link to `Header.tsx` if needed

### Backend (new API endpoint)

1. Create (or add to) a route file in `server/src/routes/`
2. Register it in `server/src/routes/index.ts`
3. Add Zod validation for all request parameters/bodies
4. Add auth middleware (`requireAuth`) for protected routes

---

## Database Schema Changes

Schema changes are needed **only** when adding a new table, column, or relation. Parameters stored inside the `config` JSON field (all SP params) require no migration.

```bash
# 1. Edit server/prisma/schema.prisma
# 2. Generate and apply the migration
npm run docker:dev:migrate    # enter a descriptive name when prompted

# 3. Commit the generated migration file — it must be version-controlled
git add server/prisma/migrations/
```

See [README.md § Running Database Migrations](README.md#running-database-migrations) for full details.

---

## Pull Request Process

1. **Open an issue first** for any non-trivial change so we can discuss approach before you invest time coding.
2. **Fork → branch → commit → push → PR** — target the `dev` branch, not `main`.
3. Fill in the **PR template** completely — describe what changed and why.
4. Ensure all CI checks pass (TypeScript, tests, build, CodeQL, secret scan).
5. Request a review if one isn't assigned automatically.
6. Address review feedback as new commits (don't force-push after review starts).
7. A maintainer will squash-merge once approved.

---

## Reporting Bugs

Use the [Bug Report template](../../issues/new?template=bug_report.yml). Include reproduction steps, expected vs actual behaviour, and any relevant error messages from the browser console or server logs.

---

## Suggesting Features

Use the [Feature Request template](../../issues/new?template=feature_request.yml). Describe the problem you're trying to solve, not just the proposed solution — this helps find the best approach together.

---

## Security Issues

Please **do not** report security vulnerabilities in public issues. See [SECURITY.md](SECURITY.md) for the responsible disclosure process.
