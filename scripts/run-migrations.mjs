// Run SQL migrations against Supabase PostgreSQL
import { readFileSync } from "fs";
import pg from "pg";

const { Pool } = pg;

// Read .env
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

async function runSql(filePath) {
  const sql = readFileSync(filePath, "utf8");
  console.log(`\n=== Running: ${filePath} ===`);
  
  // Split by semicolons, respecting SQL strings
  const statements = sql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--") || s.includes("CREATE") || s.includes("ALTER") || s.includes("INSERT"));
  
  // Better approach: execute entire SQL file as single block
  const client = await pool.connect();
  try {
    const result = await client.query(sql);
    console.log(`✅ Success`);
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log(`⚠️  Some objects already exist (harmless): ${error.message.slice(0, 80)}`);
    } else {
      console.error(`❌ Error: ${error.message}`);
      throw error;
    }
  } finally {
    client.release();
  }
}

async function main() {
  try {
    // Test connection first
    const test = await pool.query("SELECT 1 AS ok");
    console.log("✅ Database connection OK:", test.rows[0]);
    
    // Run core auth tables first
    await runSql("supabase/migrations/000_better_auth_core.sql");
    
    // Run app tables
    await runSql("supabase/migrations/001_schema.sql");
    
    console.log("\n🎉 All migrations complete!");
  } catch (error) {
    console.error("Fatal error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
