# SunnyTune — Deployment Reference (Example / Template)

> Copy this file to `DEPLOYMENT.md` and fill in **your own** values.
> **Never commit `DEPLOYMENT.md`** — it is in `.gitignore` for this reason.

---

## Live URLs

| Service               | URL                                        |
| --------------------- | ------------------------------------------ |
| **Frontend (Vercel)** | https://YOUR_APP.vercel.app                |
| **API (Vercel)**      | https://YOUR_BACKEND_PROJECT.vercel.app    |
| **Database**          | your-neon-or-postgres-host.example.com     |

---

## 1. Database (PostgreSQL / Neon)

| Field    | Value                                                |
| -------- | ---------------------------------------------------- |
| Project  | your-project-name                                    |
| Region   | your-region                                          |
| Database | your-db-name                                         |
| User     | your-db-user                                         |
| Host     | your-host.neon.tech                                  |
| Full URL | `postgresql://USER:PASSWORD@HOST/DB?sslmode=require` |

> The actual password is set in Vercel's Environment Variables as `DATABASE_URL`. Never commit it.

---

## 2. Vercel (API / Backend Server)

| Field           | Value                                           |
| --------------- | ----------------------------------------------- |
| Project Name    | YOUR_BACKEND_PROJECT_NAME                       |
| Public URL      | https://YOUR_BACKEND_PROJECT.vercel.app         |
| Root Directory  | `server`                                        |
| Framework       | Other (Node.js, auto-detected)                  |
| Branch          | `main`                                          |
| GitHub source   | `YOUR_USERNAME/YOUR_REPO`                       |

> `server/vercel.json` routes all requests to `src/index.ts` via `@vercel/node`. The `postinstall` script runs `prisma generate` automatically at build time.

### Backend Environment Variables

Set these in Vercel → Project → Settings → Environment Variables:

| Variable            | Value                                                                   |
| ------------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`      | `postgresql://USER:PASSWORD@HOST/DB?sslmode=require`                    |
| `NODE_ENV`          | `production`                                                            |
| `PORT`              | `3001`                                                                  |
| `TOKEN_SECRET`      | _(run `openssl rand -hex 32` to generate)_                              |
| `ADMIN_SECRET_HASH` | _(run `cd server && npm run hash-secret -- "your-secret"` to generate)_ |
| `CORS_ORIGIN`       | `https://YOUR_FRONTEND.vercel.app`                                      |

---

## 3. Vercel (Frontend)

| Field        | Value                                   |
| ------------ | --------------------------------------- |
| Account      | your-vercel-account                     |
| Org ID       | _(from `.vercel/project.json` locally)_ |
| Project ID   | _(from `.vercel/project.json` locally)_ |
| Project Name | YOUR_PROJECT_NAME                       |
| Framework    | Vite                                    |
| Root Dir     | `client`                                |
| Domains      | YOUR_APP.vercel.app                     |

### Vercel Environment Variables

| Variable       | Value           | Notes                            |
| -------------- | --------------- | -------------------------------- |
| `VITE_API_URL` | _(leave empty)_ | Empty = use Vercel rewrite proxy |

### Rewrites (client/vercel.json)

```
/api/(.*) → https://YOUR_BACKEND_PROJECT.vercel.app/api/$1
```

Update `client/vercel.json` with your backend Vercel URL before deploying.

---

## 4. GitHub Actions Secrets

Required for the `deploy.yml` workflow (auto-deploys both frontend and backend on push to `main`):

| Type   | Name                        | Value                                            |
| ------ | --------------------------- | ------------------------------------------------ |
| Secret | `VERCEL_TOKEN`              | Vercel → Settings → Tokens                       |
| Secret | `VERCEL_ORG_ID`             | Team/org ID from `server/.vercel/project.json`   |
| Secret | `VERCEL_BACKEND_PROJECT_ID` | Project ID from `server/.vercel/project.json`    |
| Secret | `VERCEL_FRONTEND_PROJECT_ID`| Project ID from `client/.vercel/project.json`   |

---

## 5. Manual Redeploy

### Via GitHub Actions (recommended)

GitHub → Actions → **Deploy** → Run workflow → choose `backend`, `frontend`, or `both`.

### Via Vercel CLI

```bash
# Backend
cd server && vercel --prod

# Frontend
cd client && vercel --prod
```

Or: Vercel Dashboard → Project → Deployments → Redeploy.

---

## 6. Database Migrations (manual, against hosted DB)

```bash
cd server
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require" \
npx prisma migrate deploy
```

---

## 7. Key File Locations

| File                           | Purpose                                      |
| ------------------------------ | -------------------------------------------- |
| `server/Dockerfile`            | Production Docker image (local Docker deployments) |
| `server/vercel.json`           | Vercel serverless config (backend)                 |
| `client/vercel.json`           | Vercel config: rewrites, headers, output dir       |
| `server/prisma/schema.prisma`  | Database schema                              |
| `server/prisma/migrations/`    | Migration history                            |
| `.github/workflows/deploy.yml` | Documents how deploys work (no active jobs)  |
