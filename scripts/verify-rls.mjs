import { readFileSync } from "fs";
import pg from "pg";

const { Pool } = pg;

const env = {};
readFileSync(".env", "utf8").split("\n").forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const [key, ...vals] = trimmed.split("=");
    env[key] = vals.join("=");
  }
});

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  // Check RLS status
  const rls = await pool.query(`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename IN ('family_members', 'transactions')
  `);
  console.log("RLS Status:");
  rls.rows.forEach(r => console.log(`  ${r.tablename}: RLS=${r.rowsecurity}`));

  // Check policies
  const policies = await pool.query(`
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, cmd
  `);
  console.log("\nPolicies:");
  policies.rows.forEach(r => console.log(`  ${r.tablename}: ${r.policyname} [${r.cmd}]`));

  await pool.end();
}

main();
