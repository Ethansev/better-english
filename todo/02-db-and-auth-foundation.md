# 02 — Database & auth foundation (Prisma + Better Auth)

## Goal
Add Prisma + Better Auth to the repo, define the full schema, generate migrations, and wire up the Better Auth server/client/route handler. After this step, the empty Railway DB has tables and the app can authenticate via Better Auth.

## Steps

### 1. Install dependencies
```bash
npm install @prisma/client better-auth
npm install -D prisma
npx prisma init --datasource-provider postgresql
```
Set `DATABASE_URL` in local `.env` to Railway's public proxy URL.

### 2. Generate `BETTER_AUTH_SECRET`
```bash
openssl rand -base64 32
```
Add to local `.env` and (already done) the Railway web service env.

### 3. Write `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Better Auth-owned ────────────────────────────────────────────
model User {
  id            String    @id                       // seeded with Supabase auth.users.id
  email         String    @unique
  emailVerified Boolean   @default(false)
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]
  profile       Profile?
  requests      Request[]
  analytics     Analytics[]
  @@map("user")
}

model Session {
  id        String   @id
  token     String   @unique
  userId    String
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("account")
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@map("verification")
}

// ─── App-owned ────────────────────────────────────────────────────
enum AccountType {
  free
  unlimited
  premium
}

model Profile {
  id                  String      @id
  user                User        @relation(fields: [id], references: [id], onDelete: Cascade)
  email               String?
  name                String?
  isAdmin             Boolean     @default(false) @map("is_admin")
  tonePreference      String      @default("casual") @map("tone_preference")
  accountType         AccountType @default(free) @map("account_type")
  customInstructions  String?     @map("custom_instructions")
  verbosityPreference String?     @default("balanced") @map("verbosity_preference")
  personalityPreset   String?     @map("personality_preset")
  selectedPersona     String?     @map("selected_persona")
  createdAt           DateTime    @default(now()) @map("created_at")
  @@map("profiles")
}

model Request {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  originalText String   @map("original_text")
  improvedText String   @map("improved_text")
  createdAt    DateTime @default(now()) @map("created_at")
  @@index([userId])
  @@index([createdAt(sort: Desc)])
  @@map("requests")
}

model Analytics {
  id                 String   @id @default(uuid())
  userId             String?  @map("user_id")
  user               User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  ipAddress          String?  @map("ip_address")
  originalTextLength Int      @map("original_text_length")
  improvedTextLength Int      @map("improved_text_length")
  originalText       String?  @map("original_text")
  improvedText       String?  @map("improved_text")
  createdAt          DateTime @default(now()) @map("created_at")
  @@index([createdAt(sort: Desc)])
  @@index([userId])
  @@index([ipAddress])
  @@map("analytics")
}
```

### 4. Generate the initial migration
```bash
npx prisma migrate dev --name init
```
Runs against the Railway dev DB. Creates `prisma/migrations/<ts>_init/migration.sql` and applies it.

### 5. Raw-SQL follow-up: partial index
Prisma's schema DSL can't express partial indexes. Create a follow-up migration manually:
```bash
npx prisma migrate dev --name add_anonymous_ip_partial_index --create-only
```
Edit the generated `migration.sql`:
```sql
CREATE INDEX idx_analytics_anonymous_ip
  ON analytics (ip_address, created_at DESC)
  WHERE user_id IS NULL;
```
Apply:
```bash
npx prisma migrate dev
```

### 6. Optional: rename the enum for clean SQL
If Prisma created `"AccountType"` (PascalCase) and you prefer the original `account_type`:
```sql
ALTER TYPE "AccountType" RENAME TO account_type;
```
Cosmetic — only matters if you ever drop into raw SQL.

### 7. Prisma client singleton — `src/prisma/client.ts`
```ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

### 8. Better Auth server — `src/auth/server.ts`
```ts
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/prisma/client"

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await prisma.profile.create({
            data: {
              id: user.id,
              email: user.email,
              name: user.name,
              accountType: "free",
            },
          })
        },
      },
    },
  },
})
```
The `accountLinking` block is what lets a returning Supabase user sign in with Google after migration and have Better Auth link the new `account` row to their pre-seeded `user` row (matched by email).

### 9. Better Auth React client — `src/auth/client.ts`
```ts
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient()

export const { useSession, signIn, signUp, signOut } = authClient
```

### 10. Catch-all route handler — `src/app/api/auth/[...all]/route.ts`
```ts
import { auth } from "@/auth/server"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)
```
Handles every Better Auth endpoint: `/api/auth/sign-in/social`, `/api/auth/callback/google`, `/api/auth/sign-out`, etc.

## Verification
- `npx prisma studio` opens and shows 7 tables (`user`, `session`, `account`, `verification`, `profiles`, `requests`, `analytics`)
- `psql ... -c "\d+ analytics"` shows `idx_analytics_anonymous_ip` as a partial index
- `npx prisma migrate status` reports "Database schema is up to date"
- `npm run build` succeeds
- `curl http://localhost:3000/api/auth/get-session` returns `null` without throwing
- `curl -X POST http://localhost:3000/api/auth/sign-up/email -H 'content-type: application/json' -d '{"email":"test@example.com","password":"testtest","name":"Test"}'` creates a `user` row, a matching `profile` row (via the hook), and sets a session cookie
- The next Railway deploy of the web service runs `prisma migrate deploy` successfully and starts the app

## Gotcha
The `databaseHooks.user.create.after` callback **must `await`** the profile create. If it doesn't, the next request from this user can race the profile lookup and crash.
