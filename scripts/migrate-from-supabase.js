#!/usr/bin/env node
// One-off — copies Supabase Postgres data into Railway Postgres.
//
// Preserves auth.users UUIDs as Better Auth user.id, so existing
// profiles/requests/analytics FK references restore cleanly.
//
// Skips OAuth account rows — Better Auth recreates them on first sign-in
// via accountLinking matching by email.
//
// Usage:
//   SUPABASE_DATABASE_URL='postgresql://...' \
//   DATABASE_URL='postgresql://...railway-public...' \
//   node scripts/migrate-from-supabase.js

const { Pool } = require("pg");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const BATCH = 500;

function batched(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i += BATCH) out.push(arr.slice(i, i + BATCH));
  return out;
}

async function main() {
  const srcUrl = process.env.SUPABASE_DATABASE_URL;
  const dstUrl = process.env.DATABASE_URL;
  if (!srcUrl || !dstUrl) {
    console.error(
      "Usage: SUPABASE_DATABASE_URL=... DATABASE_URL=... node scripts/migrate-from-supabase.js"
    );
    process.exit(1);
  }

  const src = new Pool({
    connectionString: srcUrl,
    ssl: { rejectUnauthorized: false },
  });
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: dstUrl }),
  });

  try {
    // 1. Pull from Supabase
    console.log("Pulling from Supabase…");
    const users = (
      await src.query(`
      SELECT id, email, email_confirmed_at, created_at, raw_user_meta_data
      FROM auth.users
      ORDER BY created_at
    `)
    ).rows;
    const profiles = (await src.query("SELECT * FROM public.profiles")).rows;
    const requests = (await src.query("SELECT * FROM public.requests")).rows;
    const analytics = (await src.query("SELECT * FROM public.analytics")).rows;

    console.log(
      `  users=${users.length} profiles=${profiles.length} requests=${requests.length} analytics=${analytics.length}`
    );

    // 2. Insert users (preserve UUIDs). createMany skipDuplicates lets us re-run safely.
    console.log("\nInserting users…");
    const userRows = users.map((u) => {
      const m = u.raw_user_meta_data || {};
      const name = m.name || m.full_name || m.user_name || null;
      return {
        id: u.id,
        email: u.email,
        emailVerified: u.email_confirmed_at !== null,
        name,
        createdAt: u.created_at,
      };
    });
    const userIns = await prisma.user.createMany({
      data: userRows,
      skipDuplicates: true,
    });
    console.log(`  inserted ${userIns.count} (skipped ${userRows.length - userIns.count})`);

    // Build the set of valid user IDs in Railway for FK validation
    const validUserIds = new Set((await prisma.user.findMany({ select: { id: true } })).map((u) => u.id));

    // 3. Insert profiles — must come after users because of FK
    console.log("\nInserting profiles…");
    const profileRows = profiles
      .filter((p) => validUserIds.has(p.id))
      .map((p) => ({
        id: p.id,
        email: p.email,
        name: p.name,
        isAdmin: !!p.is_admin,
        tonePreference: p.tone_preference || "casual",
        accountType: p.account_type || "free",
        customInstructions: p.custom_instructions,
        verbosityPreference: p.verbosity_preference || "balanced",
        personalityPreset: p.personality_preset,
        selectedPersona: p.selected_persona,
        createdAt: p.created_at,
      }));
    const skippedProfiles = profiles.length - profileRows.length;
    if (skippedProfiles) console.log(`  skipping ${skippedProfiles} orphan profile rows`);

    const profIns = await prisma.profile.createMany({
      data: profileRows,
      skipDuplicates: true,
    });
    console.log(`  inserted ${profIns.count} (skipped ${profileRows.length - profIns.count})`);

    // 4. Insert requests
    console.log("\nInserting requests…");
    const requestRows = requests
      .filter((r) => validUserIds.has(r.user_id))
      .map((r) => ({
        id: r.id,
        userId: r.user_id,
        originalText: r.original_text,
        improvedText: r.improved_text,
        createdAt: r.created_at,
      }));
    const skippedRequests = requests.length - requestRows.length;
    if (skippedRequests) console.log(`  skipping ${skippedRequests} orphan request rows`);

    let reqTotal = 0;
    for (const chunk of batched(requestRows)) {
      const res = await prisma.request.createMany({ data: chunk, skipDuplicates: true });
      reqTotal += res.count;
    }
    console.log(`  inserted ${reqTotal} (skipped ${requestRows.length - reqTotal})`);

    // 5. Insert analytics — userId can be null; only filter out non-null IDs that don't exist
    console.log("\nInserting analytics…");
    const analyticsRows = analytics.map((a) => {
      const userId =
        a.user_id && !validUserIds.has(a.user_id) ? null : a.user_id;
      return {
        id: a.id,
        userId,
        ipAddress: a.ip_address,
        originalTextLength: a.original_text_length,
        improvedTextLength: a.improved_text_length,
        originalText: a.original_text,
        improvedText: a.improved_text,
        createdAt: a.created_at,
      };
    });

    let anaTotal = 0;
    for (const chunk of batched(analyticsRows)) {
      const res = await prisma.analytics.createMany({ data: chunk, skipDuplicates: true });
      anaTotal += res.count;
    }
    console.log(`  inserted ${anaTotal} (skipped ${analyticsRows.length - anaTotal})`);

    // 6. Verify
    console.log("\nFinal Railway row counts:");
    const [u, p, r, a] = await Promise.all([
      prisma.user.count(),
      prisma.profile.count(),
      prisma.request.count(),
      prisma.analytics.count(),
    ]);
    console.log(`  user=${u} profiles=${p} requests=${r} analytics=${a}`);

    const admins = await prisma.profile.findMany({
      where: { isAdmin: true },
      select: { id: true, email: true },
    });
    console.log("\nAdmins preserved:");
    for (const ad of admins) console.log(`  ${ad.email}  (${ad.id})`);

    console.log("\n✓ Done.");
  } finally {
    await src.end();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
