/**
 * NESTIQ — Server Entry Point
 *
 * Run with: npm start  (or `node src/server.js`)
 * Dev mode with auto-restart: npm run dev
 */

require("dotenv").config();
const app = require("./app");
const { testConnection } = require("./config/db");

const PORT = process.env.PORT || 4000;

async function start() {
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error("\n❌ Could not connect to PostgreSQL. Check DATABASE_URL in your .env file.");
    console.error("   Make sure Postgres is running and the `nestiq` database exists.\n");
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`\n🏠 NESTIQ Auth API running on http://localhost:${PORT}`);
    console.log(`\n   Try it:`);
    console.log(`   curl http://localhost:${PORT}/api/health`);
    console.log(
      `   curl -X POST http://localhost:${PORT}/api/auth/register -H "Content-Type: application/json" -d '{"name":"Aarav Mehta","email":"aarav@example.com","password":"SuperSecret123"}'`
    );
    console.log("");
  });
}

start();
