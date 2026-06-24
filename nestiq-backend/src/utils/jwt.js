/**
 * NESTIQ — JWT Helpers
 *
 * Thin wrapper over `jsonwebtoken` so controllers don't talk to the
 * library directly.
 */

const jwt = require("jsonwebtoken");

function sign(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

/**
 * @returns {{ valid: true, payload: object } | { valid: false, error: string }}
 */
function verify(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, payload };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return { valid: false, error: "Token has expired." };
    }
    return { valid: false, error: "Invalid token." };
  }
}

module.exports = { sign, verify };
