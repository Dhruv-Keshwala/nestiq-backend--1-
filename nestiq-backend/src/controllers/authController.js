/**
 * NESTIQ — Auth Controller
 *
 *   POST /api/auth/register     → create account
 *   POST /api/auth/login        → log in, issue JWT
 *   GET  /api/auth/me           → fetch current user (requires token)
 *   POST /api/auth/logout       → revoke current session
 *   GET  /api/auth/check-email  → live "email already taken" check
 */

const crypto = require("crypto");
const userModel = require("../models/userModel");
const sessionModel = require("../models/sessionModel");
const { hashPassword, verifyPassword } = require("../utils/password");
const jwt = require("../utils/jwt");
const { validateSignup, validateLogin, passwordStrength } = require("../utils/validate");
const { asyncHandler } = require("../middleware/errorHandler");

const MAX_FAILED_ATTEMPTS = parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS || "5", 10);
const LOCK_WINDOW_MIN = parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MIN || "15", 10);

/** Strip fields that should never reach the client. */
function toPublicUser(user) {
  const { password_hash, failed_login_attempts, locked_until, ...publicFields } = user;
  return publicFields;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ── POST /api/auth/register ──────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { valid, errors } = validateSignup(req.body);
  if (!valid) {
    return res.status(400).json({ success: false, message: "Validation failed.", errors });
  }

  const { name, email, phone, password, role } = req.body;

  const existing = await userModel.findByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, message: "An account with this email already exists." });
  }

  const password_hash = await hashPassword(password);

  const user = await userModel.create({
    name: name.trim(),
    email,
    phone,
    password_hash,
    role,
  });

  const token = jwt.sign({ user_id: user.user_id, role: user.role });

  res.status(201).json({
    success: true,
    message: "Account created successfully.",
    data: {
      user: toPublicUser(user),
      token,
      password_strength: passwordStrength(password),
    },
  });
});

// ── POST /api/auth/login ─────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { valid, errors } = validateLogin(req.body);
  if (!valid) {
    return res.status(400).json({ success: false, message: "Validation failed.", errors });
  }

  const { email, password } = req.body;
  const user = await userModel.findByEmail(email);

  // Same generic message whether the email doesn't exist or the
  // password is wrong — avoids leaking which emails are registered.
  const genericError = { success: false, message: "Invalid email or password." };

  if (!user) {
    return res.status(401).json(genericError);
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const minsLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
    return res.status(423).json({
      success: false,
      message: `Account temporarily locked due to too many failed attempts. Try again in ${minsLeft} minute(s).`,
    });
  }

  if (!user.is_active) {
    return res.status(403).json({ success: false, message: "This account has been deactivated." });
  }

  const passwordMatches = await verifyPassword(password, user.password_hash);

  if (!passwordMatches) {
    await userModel.incrementFailedAttempts(user.user_id);
    const updatedAttempts = (user.failed_login_attempts || 0) + 1;

    if (updatedAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCK_WINDOW_MIN * 60000).toISOString();
      await userModel.update(user.user_id, { locked_until: lockedUntil });
      return res.status(423).json({
        success: false,
        message: `Too many failed attempts. Account locked for ${LOCK_WINDOW_MIN} minutes.`,
      });
    }

    return res.status(401).json(genericError);
  }

  // Success — reset failed attempts, update last login
  await userModel.resetFailedAttempts(user.user_id);
  await userModel.update(user.user_id, { last_login_at: new Date().toISOString() });

  const token = jwt.sign({ user_id: user.user_id, role: user.role });

  await sessionModel.create({
    user_id: user.user_id,
    token_hash: hashToken(token),
    ip_address: req.ip,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.json({
    success: true,
    message: "Logged in successfully.",
    data: { user: toPublicUser(user), token },
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────────
const me = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.user_id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  res.json({ success: true, data: { user: toPublicUser(user) } });
});

// ── POST /api/auth/logout ────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  const header = req.headers["authorization"];
  if (header && header.startsWith("Bearer ")) {
    const token = header.slice(7);
    await sessionModel.revoke(hashToken(token));
  }
  res.json({ success: true, message: "Logged out successfully." });
});

// ── GET /api/auth/check-email?email= ─────────────────────────────
const checkEmail = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email query param required." });
  }
  const existing = await userModel.findByEmail(email);
  res.json({ success: true, data: { available: !existing } });
});

module.exports = { register, login, me, logout, checkEmail };
