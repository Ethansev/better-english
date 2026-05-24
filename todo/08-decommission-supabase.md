# 11 — Decommission Supabase (and Vercel)

## Goal
Tear down Supabase and Vercel projects after Railway has been stable for long enough to be confident in the migration.

## Wait period
**7–14 days** of stable production traffic on Railway. During this time:
- Supabase project remains paid (cheap insurance)
- Original GitHub OAuth app (Supabase-pointed) remains active
- Google's Supabase callback URI remains active

If anything regresses in those 14 days, you can flip DNS back to Vercel and resume on Supabase with minimal data loss (anything written to Railway during the rollback window would be lost, but the bulk of historical data is intact in Supabase).

## Pre-decommission checks
- [ ] Railway error rate is at baseline (compare to Vercel error rates pre-migration)
- [ ] `analytics` table on Railway shows steady growth matching expected daily request volume
- [ ] No Supabase API traffic in the Supabase dashboard for at least 7 days
- [ ] No Vercel function invocations in the Vercel dashboard for at least 7 days

## Step 1 — Remove OAuth callbacks pointing at Supabase

### Google Cloud Console
- Credentials → OAuth 2.0 Client ID → Authorized redirect URIs
- Remove `https://<supabase-project>.supabase.co/auth/v1/callback`
- Keep the Railway and production-domain callbacks

### GitHub
- Delete the **original** GitHub OAuth app (the one with the Supabase callback)
- Keep the Railway OAuth app (the second one you created in step 07, now pointed at the production domain)

## Step 2 — Delete the Supabase project
- Supabase dashboard → Project Settings → General → Delete Project
- Confirm by typing the project name
- This permanently deletes the database, auth users, and any backups in Supabase

If you want a final backup before deletion, run one more `pg_dump --schema-only --data-only` and stash it somewhere off-platform (S3, your laptop, etc.) before clicking delete.

## Step 3 — Delete the Vercel project
- Vercel dashboard → Project → Settings → Advanced → Delete Project
- This removes deployment history but doesn't touch the GitHub repo

## Step 4 — Repo cleanup PR
- Merge the `feat/railway-migration` branch into `main` (if you haven't already)
- Remove `todo/` directory or move it to `docs/migrations/` for posterity
- Update `README.md` with the new deploy story (Railway instead of Vercel)
- Remove any `.env.example` keys that no longer exist (`NEXT_PUBLIC_SUPABASE_*`)
- Add a `.env.example` with the new keys (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `OPENAI_API_KEY`, `GOOGLE_*`, `GITHUB_*`)

## Step 5 — Tighten Railway Postgres networking (optional but recommended)
- Postgres service → Settings → Networking → disable public networking
- The web service uses `DATABASE_PRIVATE_URL` so this doesn't break anything
- Re-enable temporarily if you ever need to run `psql` from your laptop again

## Step 6 — Final follow-ups (optional)
- Set up a Railway cron service for any periodic jobs (e.g., anonymous text cleanup if you implement it)
- Configure backups on Railway Postgres (paid plan feature)
- Set up monitoring/alerting (Railway has built-in metrics; consider hooking into Discord/Slack webhooks)
- Replace `@vercel/analytics` with PostHog / Plausible / Umami if you want product analytics back

## Verification
- Supabase project is deleted (dashboard no longer lists it)
- Vercel project is deleted
- Only the Railway-pointed OAuth apps remain in Google/GitHub
- Production traffic flows uninterrupted
- Migration complete

## Post-migration housekeeping
- Tag the cutover commit: `git tag railway-migration-cutover && git push --tags`
- Note in your team's docs the new deploy story (push to `main` → Railway auto-deploys)
- Celebrate
