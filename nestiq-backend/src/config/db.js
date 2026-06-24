/**
 * NESTIQ — PostgreSQL Connection Pool
 *
 * Single shared `pg` Pool used across the app. Import `{ pool }`
 * wherever you need to run a query.
 */

const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set. Check your .env file.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Uncomment if connecting to a managed Postgres that requires SSL
  // (e.g. Render, Railway, Supabase, RDS):
  // ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

async function testConnection() {
  try {
    const { rows } = await pool.query("SELECT NOW() AS now");
    console.log(`🐘 PostgreSQL connected — server time: ${rows[0].now}`);
    return true;
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
    return false;
  }
}

module.exports = { pool, testConnection };
