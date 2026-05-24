# 08 — Preview deploy & smoke test (zero data)

## Goal
Push the migration branch to Railway and verify the full app works end-to-end against the empty Railway Postgres, before bringing real user data in.

## Steps

### 1. Push the branch
```bash
git checkout -b feat/railway-migration  # if you weren't already on a branch
git push -u origin feat/railway-migration
```
Railway auto-deploys (or trigger from the dashboard).

### 2. Watch the build & first migration
- Build logs should show `prisma generate` then `next build`
- Start logs should show `prisma migrate deploy` applying both the `init` migration and the partial-index follow-up, then `next start`
- App becomes healthy

### 3. Smoke test matrix
Run through every flow:

#### Auth
- [ ] Sign up with email/password → creates `user`, `profile`, and (after autoSignIn) a `session`
- [ ] Sign in with Google → creates `user`, `account`, `profile`, `session`
- [ ] Sign in with GitHub → same
- [ ] Sign out → session cookie cleared
- [ ] Sign in with the same email via Google after having signed up via email/password → Better Auth links to the existing `user` (account linking enabled), profile reused

#### Improve flow
- [ ] As authenticated user: submit text on `/`, watch the SSE stream, confirm:
  - The improved text appears
  - A row appears in `requests` with your `userId`
  - A row appears in `analytics` with `userId` set and text fields null (text retention is anonymous-only)
- [ ] As anonymous (incognito): submit text, confirm:
  - Stream works
  - `analytics` row with `userId = null` and text fields populated

#### Rate limiting
- [ ] Anonymous: send 20 requests from one IP — all succeed. 21st returns 429.
- [ ] Authenticated: send 30 requests — all succeed (no current limit for authed users).

#### Preferences
- [ ] Change tone, persona, custom instructions, verbosity — confirm `PATCH /api/preferences` is called, page refresh shows persisted state
- [ ] Try to PATCH `/api/preferences` with `{ isAdmin: true }` body → confirm the allowlist drops it (your profile's `isAdmin` stays false)

#### History
- [ ] After authenticated requests, history page loads via `GET /api/history`
- [ ] Delete a history entry → confirm row removed; try to delete someone else's entry (you'd need a second account to even know an ID, but worth confirming the `where: { userId: session.user.id }` clause is there)

#### Admin
- [ ] Manually flip `is_admin = true` in Prisma Studio for your test user
- [ ] Reload — `/admin` is accessible
- [ ] Sign in as a different non-admin user, attempt to visit `/admin/requests` → redirect to `/`
- [ ] **Forge an `is_admin=true` cookie** in DevTools as the non-admin user → `/api/admin/requests` must still return 403 (because `requireAdmin()` does the real DB check)
- [ ] As admin, change another user's `account_type` via the admin UI → confirm `profile.accountType` updates

#### OG images
- [ ] Visit `/opengraph-image` and `/twitter-image` — both render PNGs

### 4. Check Railway resource usage
- Postgres connections: should be a small number (Prisma pools). If you see "too many connections" errors, you may need to set `connection_limit` in `DATABASE_URL` query string.
- Memory/CPU on the web service: should be modest. SSE streams hold one connection per active request; that's fine.

## If anything fails
Don't proceed to step 09. Debug locally against the Railway dev DB first.

## Verification (must all be green before step 09)
- All checkboxes above
- `railway logs --service web` shows zero unexpected errors in the last 10 minutes of testing
- `prisma migrate status` against the Railway DB reports "Database schema is up to date"
