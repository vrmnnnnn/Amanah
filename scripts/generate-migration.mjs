// Generate SQL migration from better-auth schema
import { getMigrations } from "better-auth/db/migration";
import { getAuthTables } from "@better-auth/core/db";

// Read .env
import { readFileSync } from "fs";
const env = {};
readFileSync(".env", "utf8").split("\n").forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const [key, ...vals] = trimmed.split("=");
    env[key] = vals.join("=");
  }
});

const config = {
  database: {
    provider: "postgres",
    url: env.DATABASE_URL,
  },
  // Required plugins schema
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
};

async function main() {
  try {
    const { compileMigrations } = await getMigrations(config);
    const sql = await compileMigrations();
    console.log("-- Better Auth Core Tables");
    console.log(sql);
  } catch (error) {
    console.error("Error:", error.message);
    // Fallback: write manual SQL based on better-auth schema
    console.log("-- Falling back to manual SQL...");
    const tables = getAuthTables(config);
    console.log(JSON.stringify(Object.keys(tables), null, 2));
  }
}

main();
