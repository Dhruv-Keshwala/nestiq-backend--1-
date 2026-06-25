/**
 * NESTIQ — Auth Routes
 * Mounted at /api/auth in server.js.
 */

const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const LOGIN_WINDOW_MS = parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MIN || "15", 10) * 60 * 1000;
const LOGIN_MAX = parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS || "5", 10);

const loginLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  max: LOGIN_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please try again later." },
});

router.post("/register", authController.register);
router.post("/login", loginLimiter, authController.login);
router.get("/me", requireAuth, authController.me);
router.post("/logout", authController.logout);
router.put("/profile", requireAuth, authController.updateProfile);
router.get("/check-email", authController.checkEmail);

module.exports = router;
