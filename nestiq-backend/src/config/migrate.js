/**
 * NESTIQ — Migration Runner
 *
 * Runs schema.sql against the database in DATABASE_URL.
 * Usage: npm run migrate
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("./db");

async function migrate() {
  const sqlPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  console.log("📦 Running migration against:", process.env.DATABASE_URL.replace(/:[^:@]+@/, ":****@"));

  try {
    await pool.query(sql);
    console.log("✅ Migration complete — users & sessions tables are ready.");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
