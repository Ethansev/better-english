# 09 — Data migration from Supabase

## Goal
Copy users, profiles, requests, and analytics from Supabase Postgres into Railway Postgres, preserving UUIDs so all FKs land cleanly.

## Approach
1. `pg_dump` only the data we need (no schema — the Prisma schema on Railway is the source of truth)
2. Transform `auth.users` rows → Better Auth `user` rows via a Node script
3. Restore `profiles`, `requests`, `analytics` as-is (FKs reference the now-existing `user.id`)
4. Skip `account` rows — Better Auth's account linking creates them lazily on first OAuth sign-in

## Pre-flight
- Step 08 fully green
- A throwaway "test account" exists in Supabase you can use end-to-end after restore
- Low-traffic window picked (~30 min should be enough)
- Backups confirmed: Supabase auto-backups are on by default; verify in the Supabase dashboard

## Step 1 — Capture the dump timestamp
```bash
DUMP_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "$DUMP_TIME"  # save this — needed for step 10 delta sync
```

## Step 2 — Dump from Supabase
```bash
PGPASSWORD=<supabase-postgres-password> pg_dump \
  --host=db.<project-ref>.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --no-owner --no-privileges --data-only \
  --table=auth.users \
  --table=auth.identities \
  --table=public.profiles \
  --table=public.requests \
  --table=public.analytics \
  -f supabase-export.sql
```

Also dump `auth.users` as JSON for the transform script:
```bash
PGPASSWORD=<password> psql -h db.<ref>.supabase.co -U postgres -d postgres -A -t -c "
  SELECT json_agg(json_build_object(
    'id', id,
    'email', email,
    'email_confirmed_at', email_confirmed_at,
    'created_at', created_at,
    'raw_user_meta_data', raw_user_meta_data,
    'has_password', encrypted_password IS NOT NULL
  )) FROM auth.users;
" > auth-users.json
```

## Step 3 — Transform script: seed Better Auth `user` table
`scripts/migrate-users.ts` (one-time script, can delete after):
```ts
import { PrismaClient } from "@prisma/client"
import { readFileSync } from "node:fs"

const prisma = new PrismaClient()

interface SupabaseUser {
  id: string
  email: string
  email_confirmed_at: string | null
  created_at: string
  raw_user_meta_data: { name?: string; full_name?: string; user_name?: string } | null
  has_password: boolean
}

async function main() {
  const users: SupabaseUser[] = JSON.parse(readFileSync("auth-users.json", "utf8"))
  console.log(`Migrating ${users.length} users…`)

  for (const u of users) {
    const name =
      u.raw_user_meta_data?.name ||
      u.raw_user_meta_data?.full_name ||
      u.raw_user_meta_data?.user_name ||
      null

    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,                                              // preserve UUID
        email: u.email,
        emailVerified: u.email_confirmed_at !== null,
        name,
        createdAt: new Date(u.created_at),
      },
    })
  }
  console.log("Done.")
}

main().catch((e) => { console.error(e); process.exit(1) })
```

Run against Railway Postgres (point `DATABASE_URL` at Railway's public proxy URL temporarily):
```bash
DATABASE_URL="postgresql://...railway-public..." npx tsx scripts/migrate-users.ts
```

## Step 4 — Restore `profiles`, `requests`, `analytics`
The `pg_dump` from step 2 produced a `--data-only` SQL file with `COPY` blocks for all five tables. We only want three of them (we skip `auth.users` and `auth.identities` — already handled). Extract just those tables:

```bash
# Extract the public.* COPY blocks
awk '
  /COPY public\.(profiles|requests|analytics)/,/^\\\.$/ { print }
' supabase-export.sql > public-data.sql
```

Apply to Railway:
```bash
psql "$RAILWAY_PUBLIC_DATABASE_URL" < public-data.sql
```

If `profiles.email` has a NOT NULL constraint and any Supabase row had a null email, you'll get an error — `profiles.email` is nullable in the schema in step 02, so this should be fine.

## Step 5 — Verify counts match
```bash
# Supabase
psql "$SUPABASE_DATABASE_URL" -c "SELECT
  (SELECT count(*) FROM auth.users) AS users,
  (SELECT count(*) FROM profiles)   AS profiles,
  (SELECT count(*) FROM requests)   AS requests,
  (SELECT count(*) FROM analytics)  AS analytics;"

# Railway
psql "$RAILWAY_PUBLIC_DATABASE_URL" -c "SELECT
  (SELECT count(*) FROM \"user\")     AS users,
  (SELECT count(*) FROM profiles)   AS profiles,
  (SELECT count(*) FROM requests)   AS requests,
  (SELECT count(*) FROM analytics)  AS analytics;"
```
Numbers should match (`user` count on Railway = `auth.users` count on Supabase).

## Step 6 — Smoke test with real data
- Sign in on Railway with your existing Google account (same email you used on Supabase)
  - Should succeed; Better Auth links a new `account` row to your pre-existing `user` row (same UUID as in Supabase)
  - Visit `/history` — your old requests should appear
- As an admin user, visit `/admin/requests` — should show real historical data
- Pick a random user from the dump, query `prisma.request.findMany({ where: { userId: '<their-uuid>' } })` from a console — should return their rows

## Gotchas
- The `account_type` enum may need to be created before the COPY for profiles runs — Prisma will have created it in step 02, so this should already be in place. Double check with `\dT public.account_type` in `psql`.
- The partial index `idx_analytics_anonymous_ip` exists from step 02 — restoring analytics rows will populate it automatically.
- If you accidentally double-run the user migration, the `upsert` keeps it idempotent.
- Skipping `account` rows means email/password users effectively don't have a credential account until they reset (handled in step 10's reset wave).

## Verification
- Row counts match between Supabase and Railway
- You can sign in as an existing Supabase user on Railway and see your history
- Admin pages render real data
- `prisma.profile.findUnique({ where: { id: '<your-old-supabase-uid>' } })` returns your profile with the original `isAdmin`, `accountType`, `tonePreference`, etc.
