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
  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  
  console.log("Tables in public schema:");
  result.rows.forEach(r => console.log(`  • ${r.table_name}`));
  
  await pool.end();
}

main();
