# 09 — Rename middleware.ts → proxy.ts (Next.js 16 deprecation)

## Goal
Silence the Next.js 16 build warning: `The "middleware" file convention is deprecated. Please use "proxy" instead.`

## Background
Next.js 16 renamed the `middleware` convention to `proxy` to better reflect what it does (Edge-runtime request proxying, not traditional middleware). The old name still works in 16.x but will be removed in a future major. Migration is mechanical.

## Steps

1. Rename the file:
   ```bash
   git mv src/middleware.ts src/proxy.ts
   ```

2. Rename the exported function inside `src/proxy.ts` from `middleware` to `proxy`:
   ```ts
   export async function proxy(request: NextRequest) { /* ... */ }
   ```
   The `config` export with the `matcher` stays as-is.

3. Verify `npm run build` no longer emits the deprecation warning.

## Verification
- `npm run build` runs cleanly with no `middleware`/`proxy` deprecation warning
- The `/admin` redirect-when-unauthed behavior still works (smoke test by visiting `/admin` while signed out → redirects to `/login`)

## References
- https://nextjs.org/docs/messages/middleware-to-proxy
