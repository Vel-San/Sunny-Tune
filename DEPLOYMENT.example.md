# SunnyTune — Deployment Reference (Example / Template)

> Copy this file to `DEPLOYMENT.md` and fill in **your own** values.
> **Never commit `DEPLOYMENT.md`** — it is in `.gitignore` for this reason.

---

## Live URLs

| Service               | URL                                     |
| --------------------- | --------------------------------------- |
| **Frontend (Vercel)** | https://YOUR_APP.vercel.app             |
| **API (Vercel)**      | https://YOUR_BACKEND_PROJECT.vercel.app |
| **Database**          | your-neon-or-postgres-host.example.com  |

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

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Project Name   | YOUR_BACKEND_PROJECT_NAME               |
| Public URL     | https://YOUR_BACKEND_PROJECT.vercel.app |
| Root Directory | `server`                                |
| Framework      | Other (Node.js, auto-detected)          |
| Branch         | `main`                                  |
| GitHub source  | `YOUR_USERNAME/YOUR_REPO`               |

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

## 4. Auto-Deploy (Native Vercel GitHub Integration)

Both Vercel projects (frontend and backend) are connected to this GitHub repo via Vercel's native GitHub integration — **no secrets or workflow files required**.

Every push to `main` automatically triggers a production deploy for each project. Status appears as a commit check in GitHub (green ✔ from the Vercel bot).

To connect a new project: Vercel → Project → Settings → Git → connect repository → set production branch to `main`.

---

## 5. Manual Redeploy

Vercel Dashboard → Project → Deployments → Redeploy (works for both projects).

Or via CLI:

```bash
# Backend
cd server && vercel --prod

# Frontend
cd client && vercel --prod
```

---

## 6. Database Migrations (manual, against hosted DB)

```bash
cd server
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require" \
npx prisma migrate deploy
```

---

## 7. Key File Locations

| File                          | Purpose                                            |
| ----------------------------- | -------------------------------------------------- |
| `server/Dockerfile`           | Production Docker image (local Docker deployments) |
| `server/vercel.json`          | Vercel serverless config (backend)                 |
| `client/vercel.json`          | Vercel config: rewrites, headers, output dir       |
| `server/prisma/schema.prisma` | Database schema                                    |
| `server/prisma/migrations/`   | Migration history                                  |
