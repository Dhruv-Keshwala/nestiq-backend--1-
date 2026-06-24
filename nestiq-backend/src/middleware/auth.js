/**
 * NESTIQ — Auth Middleware
 *
 * requireAuth: verifies the JWT in the Authorization header and
 * attaches the decoded payload to req.user.
 *
 * requireRole: composes with requireAuth to restrict a route to
 * specific roles (e.g. admin-only routes).
 */

const jwt = require("../utils/jwt");
const sessionModel = require("../models/sessionModel");
const crypto = require("crypto");

async function requireAuth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Missing or malformed Authorization header." });
  }

  const token = header.slice(7);
  const result = jwt.verify(token);

  if (!result.valid) {
    return res.status(401).json({ success: false, message: result.error });
  }

  // Check the session hasn't been revoked (logout) server-side.
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const active = await sessionModel.isActive(tokenHash);
  if (!active) {
    return res.status(401).json({ success: false, message: "Session has been logged out." });
  }

  req.user = result.payload; // { user_id, role, iat, exp }
  req.token = token;
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "You don't have permission to access this resource." });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
