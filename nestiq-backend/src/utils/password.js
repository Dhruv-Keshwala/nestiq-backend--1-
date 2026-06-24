/**
 * NESTIQ — Password Hashing
 *
 * Thin wrapper over `bcryptjs`.
 */

const bcrypt = require("bcryptjs");

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);

function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

function verifyPassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

module.exports = { hashPassword, verifyPassword };
