# 03 — Application code rewrite

## Goal
Port the entire app off Supabase: hooks, middleware, every API route, and remove Vercel-specific code. Move browser-direct DB writes behind server routes. Preserve hook public APIs so consumer files don't need changes.

This is the largest step. Land it as one PR or a small stack of PRs.

---

## Part A — New server routes (do these first; hooks depend on them)

### `src/app/api/history/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/auth/server"
import { prisma } from "@/prisma/client"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const entries = await prisma.request.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  return NextResponse.json({ entries })
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { id } = await req.json()
  await prisma.request.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
```

### `src/app/api/preferences/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/auth/server"
import { prisma } from "@/prisma/client"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const profile = await prisma.profile.findUnique({ where: { id: session.user.id } })
  return NextResponse.json({ profile })
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await req.json()
  // Allowlist — never trust client to set isAdmin or accountType from here
  const allowed = {
    tonePreference: body.tonePreference,
    customInstructions: body.customInstructions?.slice(0, 500),
    verbosityPreference: body.verbosityPreference,
    personalityPreset: body.personalityPreset,
    selectedPersona: body.selectedPersona,
  }
  const profile = await prisma.profile.update({
    where: { id: session.user.id },
    data: Object.fromEntries(Object.entries(allowed).filter(([, v]) => v !== undefined)),
  })
  return NextResponse.json({ profile })
}
```

---

## Part B — Hook rewrites (preserve public API)

### `src/auth/useAuth.ts` (replaces `src/supabase/useAuth.ts`)
Public API must match what consumers depend on: `{ user, isAuthenticated, isAdmin, isLoading, signInWithGoogle, signInWithGitHub, signInWithEmail, signUpWithEmail, signOut }`.

```ts
"use client"
import { useEffect, useState } from "react"
import { authClient, useSession } from "@/auth/client"

export function useAuth() {
  const { data: session, isPending } = useSession()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!session) { setIsAdmin(false); return }
    setIsAdmin(document.cookie.includes("is_admin=true"))
  }, [session])

  return {
    user: session?.user ?? null,
    isAuthenticated: !!session,
    isAdmin,
    isLoading: isPending,
    signInWithGoogle: () => authClient.signIn.social({ provider: "google", callbackURL: "/" }),
    signInWithGitHub: () => authClient.signIn.social({ provider: "github", callbackURL: "/" }),
    signInWithEmail: (email: string, password: string) =>
      authClient.signIn.email({ email, password }),
    signUpWithEmail: (email: string, password: string, name: string) =>
      authClient.signUp.email({ email, password, name }),
    signOut: () => authClient.signOut(),
  }
}
```

### `src/auth/useHistory.ts` (replaces `src/supabase/useHistory.ts`)
Replace `supabase.from("requests")` calls with `fetch('/api/history', ...)`. Keep the return shape identical.

### `src/hooks/usePreferences.ts`
Rewrite the write path from `supabase.from("profiles").update(...)` to `fetch('/api/preferences', { method: 'PATCH', ... })`. Rewrite the read path to `fetch('/api/preferences')` (or accept server-rendered initial state). Public hook signature stays the same.

---

## Part C — Middleware

### `src/middleware.ts` (delete `src/supabase/middleware.ts`)
```ts
import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"
import { auth } from "@/auth/server"
import { prisma } from "@/prisma/client"

export async function middleware(req: NextRequest) {
  const sessionCookie = getSessionCookie(req)
  const pathname = req.nextUrl.pathname

  if (pathname.startsWith("/admin") && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const res = NextResponse.next()

  if (pathname.startsWith("/admin") || pathname === "/") {
    const session = await auth.api.getSession({ headers: req.headers })
    if (session) {
      const profile = await prisma.profile.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true },
      })
      const isAdmin = profile?.isAdmin === true
      if (pathname.startsWith("/admin") && !isAdmin) {
        return NextResponse.redirect(new URL("/", req.url))
      }
      res.cookies.set("is_admin", String(isAdmin), {
        maxAge: 60 * 5,            // 5 min (was 24h on Supabase)
        sameSite: "lax",
        path: "/",
      })
    }
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
```

Notes:
- Middleware does **not** authoritatively gate admin routes — `requireAdmin()` in each handler does (Part E). Middleware is for redirect UX only.
- Lowered the `is_admin` cookie maxAge from 24h to 5 min so demotions take effect quickly.

---

## Part D — Auth helpers

### `src/lib/auth-helpers.ts` (new)
```ts
import { headers } from "next/headers"
import { auth } from "@/auth/server"
import { prisma } from "@/prisma/client"

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

export async function requireAdmin() {
  const user = await getSessionUser()
  if (!user) return { ok: false as const, status: 401 }
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  })
  if (!profile?.isAdmin) return { ok: false as const, status: 403 }
  return { ok: true as const, user }
}
```

---

## Part E — API route rewrites

### `src/lib/rate-limit.ts`
```ts
import { prisma } from "@/prisma/client"

const ANONYMOUS_DAILY_LIMIT = 20
const ONE_DAY_MS = 24 * 60 * 60 * 1000

export async function checkAnonymousRateLimit(ipAddress: string) {
  const since = new Date(Date.now() - ONE_DAY_MS)
  const count = await prisma.analytics.count({
    where: { userId: null, ipAddress, createdAt: { gte: since } },
  })
  return {
    allowed: count < ANONYMOUS_DAILY_LIMIT,
    used: count,
    limit: ANONYMOUS_DAILY_LIMIT,
    resetsAt: new Date(Date.now() + ONE_DAY_MS),
  }
}

export function extractClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return headers.get("x-real-ip") ?? "unknown"
}
```

### `src/app/api/rate-limit/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/auth/server"
import { checkAnonymousRateLimit, extractClientIp } from "@/lib/rate-limit"

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session) return NextResponse.json({ unlimited: true })
  const ip = extractClientIp(req.headers)
  const status = await checkAnonymousRateLimit(ip)
  return NextResponse.json(status)
}
```

### `src/app/api/improve/route.ts`
Preserve the existing SSE streaming structure and OpenAI call. Swap auth + writes only.

```ts
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/auth/server"
import { prisma } from "@/prisma/client"
import { checkAnonymousRateLimit, extractClientIp } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user.id ?? null
  const ip = extractClientIp(req.headers)

  if (!userId) {
    const limit = await checkAnonymousRateLimit(ip)
    if (!limit.allowed) {
      return NextResponse.json({ error: "rate_limited", ...limit }, { status: 429 })
    }
  }

  const { text /*, tone, persona, customInstructions, … */ } = await req.json()
  // NOTE: do NOT accept userId from req.json() — always use session.user.id

  // ... existing OpenAI streaming setup (unchanged) ...
  // const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", { ... })

  let improvedText = ""
  const transformStream = new TransformStream({
    transform(chunk, controller) {
      // accumulate chunks AND forward to client (same parsing as today)
      controller.enqueue(chunk)
    },
    async flush() {
      if (userId) {
        await prisma.request.create({
          data: { userId, originalText: text, improvedText },
        })
      }
      await prisma.analytics.create({
        data: {
          userId,
          ipAddress: ip,
          originalTextLength: text.length,
          improvedTextLength: improvedText.length,
          originalText: userId ? null : text,         // text stored only for anon
          improvedText: userId ? null : improvedText,
        },
      })
    },
  })

  return new Response(openaiResponse.body!.pipeThrough(transformStream), {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  })
}
```

### Admin routes — `requireAdmin()` at the top of each

**`src/app/api/admin/requests/route.ts`**
```ts
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/prisma/client"

export async function GET() {
  const admin = await requireAdmin()
  if (!admin.ok) return NextResponse.json({ error: "forbidden" }, { status: admin.status })

  const requests = await prisma.request.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { email: true, name: true } } },
  })
  return NextResponse.json({ requests })
}
```

**`src/app/api/admin/stats/route.ts`** — same prelude. Replace each Supabase query with the Prisma equivalent. For time-bucketing (e.g. requests per day) use `prisma.$queryRaw` with `date_trunc`, or `findMany` + JS aggregation if volume is small.

**`src/app/api/admin/users/[id]/route.ts`**
```ts
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/prisma/client"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin.ok) return NextResponse.json({ error: "forbidden" }, { status: admin.status })

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true, _count: { select: { requests: true, analytics: true } } },
  })
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({ user })
}
```

**`src/app/api/admin/users/[id]/account-type/route.ts`**
```ts
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/prisma/client"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin.ok) return NextResponse.json({ error: "forbidden" }, { status: admin.status })

  const { id } = await params
  const { accountType } = await req.json()
  if (!["free", "unlimited", "premium"].includes(accountType)) {
    return NextResponse.json({ error: "invalid_account_type" }, { status: 400 })
  }
  const profile = await prisma.profile.update({ where: { id }, data: { accountType } })
  return NextResponse.json({ profile })
}
```

---

## Part F — Strip Vercel-isms

### Edge runtime → Node
- `src/app/opengraph-image.tsx`: delete `export const runtime = 'edge'`
- `src/app/twitter-image.tsx`: delete `export const runtime = 'edge'`

Next.js `ImageResponse` runs fine on Node — the only reason for `edge` was Vercel.

### Remove Vercel Analytics
- `src/app/layout.tsx`: remove the `import { Analytics } from "@vercel/analytics/next"` line and the `<Analytics />` JSX
- `npm uninstall @vercel/analytics`

### Uninstall Supabase
```bash
npm uninstall @supabase/ssr @supabase/supabase-js
npm uninstall -D supabase
```

### Delete old files
- `src/supabase/client.ts`
- `src/supabase/server.ts`
- `src/supabase/middleware.ts`
- `src/supabase/useAuth.ts`
- `src/supabase/useHistory.ts`
- `src/app/api/auth/callback/route.ts` (Better Auth's `[...all]` handles this now)
- `supabase/` directory (live in git history; delete `rm -rf supabase/`)

### Consumer updates
- `src/app/login/page.tsx`: change import from `@/supabase/useAuth` to `@/auth/useAuth`. Should be the only change (public hook API preserved).
- Any other file importing from `@/supabase/*`: update import path.

---

## Critical security rules (applies to everything in Part E)

1. **Never read `userId` from the request body or query string.** Always source it from `session.user.id`.
2. **Every `/api/admin/*` handler calls `requireAdmin()` as its first statement.** No "middleware handles it" — without RLS, middleware is no longer an authoritative authz layer.
3. **Admin update routes use an allowlist** of fields — don't accept arbitrary partial objects (the `account-type` route is the pattern).

---

## Verification
- `npm run build` succeeds
- `grep -rE "@supabase|@vercel/analytics" src/` returns nothing
- `grep -rE "runtime = ['\"]edge['\"]" src/` returns nothing
- Sign in with Google end-to-end on `localhost:3000`
- History page loads via `/api/history` (check Network tab)
- Updating a preference hits `/api/preferences` PATCH and persists
- `/admin` redirects non-admins to `/`
- **Forged-cookie test**: as a non-admin user, set `is_admin=true` in DevTools cookies, hit `/api/admin/requests` → returns 403 (because `requireAdmin()` does the real DB check)
- **Forged-userId test**: as user A, POST to `/api/improve` with `{ userId: "<user-B-id>" }` in body → the resulting `requests` row has user A's id, not the forged one
- Anonymous rate limit: 21st request from a single IP within 24h returns 429
- The OG image and Twitter image routes still render (visit `http://localhost:3000/opengraph-image`)
