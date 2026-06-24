/**
 * NESTIQ — Sessions Data Access Layer
 *
 * Tracks issued JWTs (by hash, never the raw token) so a session can
 * be revoked server-side on logout, and so "active sessions" / "log
 * out everywhere" features have something to query later.
 */

const { pool } = require("../config/db");

async function create({ user_id, token_hash, ip_address, expires_at }) {
  const { rows } = await pool.query(
    `INSERT INTO sessions (user_id, token_hash, ip_address, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [user_id, token_hash, ip_address || null, expires_at]
  );
  return rows[0];
}

async function revoke(tokenHash) {
  await pool.query(
    "UPDATE sessions SET is_active = FALSE WHERE token_hash = $1",
    [tokenHash]
  );
}

async function isActive(tokenHash) {
  const { rows } = await pool.query(
    "SELECT is_active FROM sessions WHERE token_hash = $1",
    [tokenHash]
  );
  // If no session row exists at all (e.g. token issued before sessions
  // tracking existed), default to true rather than locking everyone out.
  if (rows.length === 0) return true;
  return rows[0].is_active;
}

module.exports = { create, revoke, isActive };
