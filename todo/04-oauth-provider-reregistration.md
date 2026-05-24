# 07 — OAuth provider re-registration

## Goal
Add Railway-pointed OAuth callbacks to Google and GitHub. Leave the Supabase callbacks in place until cutover stabilizes so rollback is possible.

## Better Auth callback paths
- Google: `{BETTER_AUTH_URL}/api/auth/callback/google`
- GitHub: `{BETTER_AUTH_URL}/api/auth/callback/github`

`BETTER_AUTH_URL` for now = the Railway `*.up.railway.app` URL from step 01. It changes to your production domain in step 10.

## Google Cloud Console

1. Open [console.cloud.google.com](https://console.cloud.google.com), select the project you used for Supabase OAuth.
2. APIs & Services → Credentials → click the existing OAuth 2.0 Client ID.
3. **Authorized redirect URIs** → Add URI:
   ```
   https://<your-railway-domain>.up.railway.app/api/auth/callback/google
   ```
4. Keep the existing Supabase URI (`https://<supabase-project>.supabase.co/auth/v1/callback`) — rollback path.
5. Save. Copy the Client ID and Client Secret.
6. Set on Railway web service:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

## GitHub OAuth app

GitHub allows only **one** Authorization callback URL per OAuth app. So don't edit the existing one — create a second app for Railway.

1. github.com → Settings → Developer settings → OAuth Apps → **New OAuth App**.
2. Fill in:
   - Application name: `Better English (Railway)`
   - Homepage URL: your Railway URL
   - Authorization callback URL: `https://<your-railway-domain>.up.railway.app/api/auth/callback/github`
3. Click "Generate a new client secret". Save Client ID + secret.
4. Set on Railway web service:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`

Leave the original (Supabase-pointed) GitHub OAuth app untouched — it stays active until step 11 decommissions Supabase.

## When you later swap to a production domain (step 10)
- Google: add the production callback URI alongside the Railway one
- GitHub: edit the Railway OAuth app's callback to the production domain (it's safe to swap because the Supabase OAuth app is a separate app and provides rollback)

## Verification
- Trigger Railway to redeploy after setting the OAuth env vars (Service → Deploy or push a no-op commit)
- Visit the Railway URL → Login → Sign in with Google → should complete back to `/`
- Same with GitHub
- Check Prisma Studio on Railway: `user` row exists, `account` row exists with the right `providerId`
