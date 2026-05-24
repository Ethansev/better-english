# 10 — Production cutover

## Goal
Move production traffic from Vercel + Supabase to Railway, with minimal downtime and a clear rollback path until step 11.

## Pre-flight
- Step 09 complete, row counts match, smoke test passed on Railway with real data
- You have access to: DNS provider, Vercel project, Supabase dashboard, Railway dashboard
- Email-sending capability via Better Auth (configure an email provider — Resend, Postmark, etc. — before this step; Better Auth's `sendResetPassword` config needs a callable that sends mail)

## Step 1 — Email/password reset wave
Supabase bcrypt → Better Auth scrypt has no clean password migration. Every user with a password must reset.

### 1a. Identify affected users
From the dump in step 09:
```bash
jq '[.[] | select(.has_password == true) | .email]' auth-users.json > reset-targets.json
```

### 1b. Configure email sending in Better Auth
In `src/auth/server.ts`, ensure `emailAndPassword.sendResetPassword` is wired to a provider. Example with Resend:
```ts
emailAndPassword: {
  enabled: true,
  autoSignIn: true,
  sendResetPassword: async ({ user, url }) => {
    await resend.emails.send({
      from: "Better English <noreply@yourdomain.com>",
      to: user.email,
      subject: "Reset your password (migration)",
      text: `We've moved to a new platform. Please reset your password to continue: ${url}`,
    })
  },
},
```

### 1c. Trigger resets in bulk
Write a one-off script `scripts/send-reset-emails.ts`:
```ts
import { readFileSync } from "node:fs"
const emails: string[] = JSON.parse(readFileSync("reset-targets.json", "utf8"))

for (const email of emails) {
  await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/forget-password`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, redirectTo: `${process.env.BETTER_AUTH_URL}/reset-password` }),
  })
}
```
Run against the Railway URL (BETTER_AUTH_URL is still the railway.app URL at this point — that's fine because the reset link works regardless of which URL the user came from, as long as it points at Railway).

Email copy should explain the platform move and the deadline.

### 1d. Wait
Recommended: 48h. During this window, users can reset on Railway via the Railway URL. They can still use the production app on Vercel as normal — the two backends are independent.

## Step 2 — Capture pre-cutover state
Before flipping DNS, capture another `auth-users.json` snapshot from Supabase to catch new sign-ups since step 09:
```bash
psql -h db.<ref>.supabase.co ... > auth-users-final.json  # same query as step 09
```

## Step 3 — Update production OAuth + env

### 3a. Add production-domain callbacks to OAuth providers
- Google: add `https://<production-domain>/api/auth/callback/google` as Authorized redirect URI (alongside the Railway URL)
- GitHub (Railway OAuth app): edit the Authorization callback URL to `https://<production-domain>/api/auth/callback/github`. The Supabase OAuth app is unchanged — rollback path intact.

### 3b. Update Railway env vars
- `BETTER_AUTH_URL` → `https://<production-domain>`
- Trigger a redeploy

### 3c. Attach custom domain to Railway web service
Railway dashboard → Web service → Settings → Networking → Custom Domain → add your production domain. Railway gives you the CNAME target.

## Step 4 — DNS cutover
At your DNS provider, change the apex and `www` records to point at Railway's CNAME target (or A record, depending on provider). TTL was already low if you planned for this — if not, you'll have a longer propagation window.

**Until DNS fully propagates, traffic is split between Vercel and Railway.** New writes during this window go to whichever backend the user's resolver pointed at. This is unavoidable with DNS cutovers; it's why step 5 below catches the delta.

## Step 5 — Delta sync
Re-run the dump from step 09, filtered to rows created since the step-09 timestamp:
```bash
DUMP_TIME=<the timestamp saved in step 09>

PGPASSWORD=... pg_dump \
  --host=db.<ref>.supabase.co ... \
  --data-only \
  --table=auth.users \
  --table=public.profiles \
  --table=public.requests \
  --table=public.analytics \
  --where="created_at > '$DUMP_TIME'" \
  -f delta.sql
```

Run a delta-aware version of `migrate-users.ts` (the upsert in step 09 is already idempotent).

For `requests` and `analytics`, COPY with `ON CONFLICT DO NOTHING` won't work via plain `pg_dump` output. Easier approach: load delta rows into a staging schema, then `INSERT ... ON CONFLICT (id) DO NOTHING` from staging into prod tables.

After delta sync, verify final counts match between Supabase and Railway.

## Step 6 — Make Vercel read-only / decommissioned
- In the Vercel dashboard, pause the production deployment, or change DNS to no longer route to it (already done in step 4)
- Keep the Vercel project for now — full deletion happens in step 11

## Step 7 — Monitor
- Watch Railway logs for the first 30 minutes after DNS propagation
- Check the analytics table is growing
- Spot-check sign-ins for users who had reset passwords

## Rollback (until step 11)
If something is broken in production:
1. Flip DNS back to Vercel
2. Vercel is still pointed at Supabase — all reads/writes resume there
3. Don't run the delta-sync in reverse (that's a data-merge nightmare); just accept that any writes that landed on Railway during the failed cutover window are stranded
4. Triage, fix, retry

## Verification
- `dig <production-domain>` resolves to Railway
- Signing in with a Google/GitHub account on the production domain works
- A password-reset user can sign in with the new password
- `analytics` row counts on Railway are increasing
- Vercel deployment shows zero traffic in the last 30 min
