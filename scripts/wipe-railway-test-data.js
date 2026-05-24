#!/usr/bin/env node
// Wipes all data from the Railway DB — for use BEFORE running
// migrate-from-supabase.js so test users created during OAuth smoke testing
// don't conflict with the real users we're about to import.
//
// Deletes in FK-safe order: analytics → requests → profiles → sessions/accounts/users
//
// Usage: DATABASE_URL='...' node scripts/wipe-railway-test-data.js

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

async function main() {
  const dstUrl = process.env.DATABASE_URL;
  if (!dstUrl) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: dstUrl }),
  });

  try {
    console.log("Wiping Railway DB…");
    const [analytics, requests, profiles, sessions, accounts, verifications, users] =
      await Promise.all([
        prisma.analytics.deleteMany(),
        prisma.request.deleteMany(),
        prisma.profile.deleteMany(),
        prisma.session.deleteMany(),
        prisma.account.deleteMany(),
        prisma.verification.deleteMany(),
      ]).then(async (results) => {
        const userDel = await prisma.user.deleteMany();
        return [...results, userDel];
      });
    console.log(
      `  deleted: analytics=${analytics.count} requests=${requests.count} profiles=${profiles.count} sessions=${sessions.count} accounts=${accounts.count} verifications=${verifications.count} users=${users.count}`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
