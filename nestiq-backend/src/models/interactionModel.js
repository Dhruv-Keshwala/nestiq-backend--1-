/**
 * NESTIQ — Interaction Data Access Layer
 *
 * Handles database operations for property likes and favorites.
 */

const { pool } = require("../config/db");

async function getFavorites(userId) {
  const { rows } = await pool.query(
    "SELECT property_id FROM favorites WHERE user_id = $1",
    [userId]
  );
  return rows.map(r => r.property_id);
}

async function addFavorite(userId, propertyId) {
  await pool.query(
    "INSERT INTO favorites (user_id, property_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [userId, String(propertyId)]
  );
}

async function removeFavorite(userId, propertyId) {
  await pool.query(
    "DELETE FROM favorites WHERE user_id = $1 AND property_id = $2",
    [userId, String(propertyId)]
  );
}

async function getLikes(userId) {
  const { rows } = await pool.query(
    "SELECT property_id FROM likes WHERE user_id = $1",
    [userId]
  );
  return rows.map(r => r.property_id);
}

async function addLike(userId, propertyId) {
  await pool.query(
    "INSERT INTO likes (user_id, property_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [userId, String(propertyId)]
  );
}

async function removeLike(userId, propertyId) {
  await pool.query(
    "DELETE FROM likes WHERE user_id = $1 AND property_id = $2",
    [userId, String(propertyId)]
  );
}

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  getLikes,
  addLike,
  removeLike,
};
