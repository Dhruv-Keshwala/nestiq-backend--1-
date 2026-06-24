/**
 * NESTIQ — Users Data Access Layer
 *
 * All raw SQL for the `users` table lives here so controllers stay
 * free of query strings.
 */

const { pool } = require("../config/db");

async function findByEmail(email) {
  const { rows } = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email.toLowerCase().trim()]
  );
  return rows[0] || null;
}

async function findById(userId) {
  const { rows } = await pool.query(
    "SELECT * FROM users WHERE user_id = $1",
    [userId]
  );
  return rows[0] || null;
}

async function create({ name, email, phone, password_hash, role }) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, email.toLowerCase().trim(), phone || null, password_hash, role || "renter"]
  );
  return rows[0];
}

async function update(userId, patch) {
  const keys = Object.keys(patch);
  if (keys.length === 0) return findById(userId);

  const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(", ");
  const values = keys.map((key) => patch[key]);

  const { rows } = await pool.query(
    `UPDATE users SET ${setClause} WHERE user_id = $1 RETURNING *`,
    [userId, ...values]
  );
  return rows[0];
}

async function incrementFailedAttempts(userId) {
  await pool.query(
    "UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE user_id = $1",
    [userId]
  );
}

async function resetFailedAttempts(userId) {
  await pool.query(
    "UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE user_id = $1",
    [userId]
  );
}

module.exports = {
  findByEmail,
  findById,
  create,
  update,
  incrementFailedAttempts,
  resetFailedAttempts,
};
