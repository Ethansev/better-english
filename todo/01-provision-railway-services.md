# 01 — Provision Railway services

## Goal
Stand up a Railway project with two services (Postgres + Web) ready to receive deploys. No data, no domain yet.

## Prereqs
- Railway account
- Railway CLI installed (`brew install railway` or `npm i -g @railway/cli`)
- Existing GitHub repo (this one) connected to your GitHub account

## Steps

### 1. Create the project
Either via the dashboard (`railway.app` → New Project) or CLI:
```bash
railway login
railway init   # in this repo
```
Name it something like `better-english`.

### 2. Add Postgres
Dashboard → New Service → Database → PostgreSQL. Railway provisions and exposes:
- `DATABASE_URL` — public proxy URL (use from your laptop for migrations/`pg_restore`)
- `DATABASE_PRIVATE_URL` — internal-network URL (use from the web service)

### 3. Add the Web service
Dashboard → New Service → GitHub Repo → pick this repo. Watch points:
- **Root directory**: repo root
- **Build command**: `prisma generate && next build`
- **Start command**: `prisma migrate deploy && next start -p ${PORT}`
- **Watch paths**: leave default (deploy on any push)

### 4. Wire env vars on the Web service
Service → Variables. Use Railway's reference variable syntax for the DB:

| Key | Value |
| --- | --- |
| `DATABASE_URL` | `${{ Postgres.DATABASE_PRIVATE_URL }}` |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` output |
| `BETTER_AUTH_URL` | the Railway-provided `*.up.railway.app` URL (update later for prod domain) |
| `OPENAI_API_KEY` | copy from current Vercel project |
| `GOOGLE_CLIENT_ID` | placeholder — filled in step 07 |
| `GOOGLE_CLIENT_SECRET` | placeholder — filled in step 07 |
| `GITHUB_CLIENT_ID` | placeholder — filled in step 07 |
| `GITHUB_CLIENT_SECRET` | placeholder — filled in step 07 |
| `NODE_ENV` | `production` (Railway sets this anyway, but be explicit) |

### 5. Generate a public domain
Web service → Settings → Networking → Generate Domain. Note the URL — this is your `BETTER_AUTH_URL` for now. Custom domain comes later (step 10).

### 6. Lock Postgres down
Postgres service → Settings → Networking. The web service uses the private URL, so you can optionally disable public networking. Recommended: keep it enabled for now (you'll need it for `pg_restore` from your laptop in step 09), disable after migration.

## Verification
- `railway status` shows two services, both healthy
- The web service deploys (first deploy will fail at `prisma migrate deploy` because there's no schema yet — that's expected; step 02 fixes it)
- You can connect to Postgres with `psql $DATABASE_URL` from your laptop using the public proxy URL

## Notes
- Do not attach a custom domain yet — wait until step 10 (production cutover)
- Railway's free trial credits cover the migration period; switch to a paid plan before step 10 so the service doesn't suspend
