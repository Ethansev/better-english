#!/usr/bin/env node
// One-off recon — connects to Supabase Postgres and reports row counts
// for the tables we're about to migrate. Read-only.
//
// Usage:
//   SUPABASE_DATABASE_URL='postgresql://...' node scripts/inspect-supabase.js
const { Pool } = require("pg");

async function main() {
  const url = process.env.SUPABASE_DATABASE_URL;
  if (!url) {
    console.error(
      "Usage: SUPABASE_DATABASE_URL='postgresql://...' node scripts/inspect-supabase.js"
    );
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const queries = [
      ["auth.users", "SELECT count(*) FROM auth.users"],
      ["auth.identities", "SELECT count(*) FROM auth.identities"],
      ["public.profiles", "SELECT count(*) FROM public.profiles"],
      ["public.requests", "SELECT count(*) FROM public.requests"],
      ["public.analytics", "SELECT count(*) FROM public.analytics"],
    ];
    console.log("Row counts:");
    for (const [label, sql] of queries) {
      const { rows } = await pool.query(sql);
      console.log(`  ${label.padEnd(20)} ${rows[0].count}`);
    }

    console.log("\nWith-password users (will need reset email):");
    const { rows: pw } = await pool.query(
      "SELECT count(*) FROM auth.users WHERE encrypted_password IS NOT NULL"
    );
    console.log(`  ${pw[0].count}`);

    console.log("\nOAuth providers in use:");
    const { rows: provs } = await pool.query(
      "SELECT provider, count(*) FROM auth.identities GROUP BY provider ORDER BY count DESC"
    );
    for (const r of provs) console.log(`  ${r.provider.padEnd(15)} ${r.count}`);

    console.log("\nAdmin users:");
    const { rows: admins } = await pool.query(
      "SELECT id, email FROM public.profiles WHERE is_admin = true"
    );
    for (const a of admins) console.log(`  ${a.email}  (${a.id})`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
