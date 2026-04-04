# SunnyTune — Deployment Reference (Example / Template)

> Copy this file to `DEPLOYMENT.md` and fill in **your own** values.
> **Never commit `DEPLOYMENT.md`** — it is in `.gitignore` for this reason.

---

## Live URLs

| Service               | URL                                        |
| --------------------- | ------------------------------------------ |
| **Frontend (Vercel)** | https://YOUR_APP.vercel.app                |
| **API (Railway)**     | https://YOUR_APP-production.up.railway.app |
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

> The actual password is set directly in Railway as `DATABASE_URL`. Never commit it.

---

## 2. Railway (API Server)

| Field           | Value                                      |
| --------------- | ------------------------------------------ |
| Project Name    | YOUR_PROJECT_NAME                          |
| Project ID      | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`     |
| Service Name    | YOUR_SERVICE_NAME                          |
| Service ID      | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`     |
| Environment     | production                                 |
| Environment ID  | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`     |
| Public URL      | https://YOUR_APP-production.up.railway.app |
| Builder         | Dockerfile                                 |
| Root Directory  | `/server`                                  |
| Dockerfile path | `/server/Dockerfile`                       |
| GitHub source   | `YOUR_USERNAME/YOUR_REPO` → branch `main`  |

### Railway Environment Variables

Set these in Railway → Service → Variables:

| Variable            | Value                                                                   |
| ------------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`      | `postgresql://USER:PASSWORD@HOST/DB?sslmode=require`                    |
| `NODE_ENV`          | `production`                                                            |
| `PORT`              | `3001`                                                                  |
| `TOKEN_SECRET`      | _(run `openssl rand -hex 32` to generate)_                              |
| `ADMIN_SECRET_HASH` | _(run `cd server && npm run hash-secret -- "your-secret"` to generate)_ |
| `CORS_ORIGIN`       | `https://YOUR_APP.vercel.app`                                           |

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
/api/(.*) → https://YOUR_RAILWAY_URL.up.railway.app/api/$1
```

Update `client/vercel.json` with your Railway URL before deploying.

---

## 4. GitHub Actions Secrets

If using CLI-based GitHub Actions deploys (the default uses native integrations — no secrets needed):

| Type   | Name                | Notes                             |
| ------ | ------------------- | --------------------------------- |
| Secret | `VERCEL_TOKEN`      | Vercel → Settings → Tokens        |
| Secret | `VERCEL_ORG_ID`     | From local `.vercel/project.json` |
| Secret | `VERCEL_PROJECT_ID` | From local `.vercel/project.json` |

---

## 5. Manual Redeploy

### Railway (server)

Via dashboard: Railway → Project → Service → Deployments → Redeploy

### Vercel (client)

```bash
# From repo root, after running `npx vercel link` locally
VERCEL_ORG_ID=<your-org-id> \
VERCEL_PROJECT_ID=<your-project-id> \
npx vercel build --prod --token=<VERCEL_TOKEN>
npx vercel deploy --prebuilt --prod --token=<VERCEL_TOKEN>
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

| File                           | Purpose                                      |
| ------------------------------ | -------------------------------------------- |
| `server/Dockerfile`            | Production Docker image (Railway)            |
| `server/railway.toml`          | Railway build/deploy config                  |
| `client/vercel.json`           | Vercel config: rewrites, headers, output dir |
| `server/prisma/schema.prisma`  | Database schema                              |
| `server/prisma/migrations/`    | Migration history                            |
| `.github/workflows/deploy.yml` | Documents how deploys work (no active jobs)  |
