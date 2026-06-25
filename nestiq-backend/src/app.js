/**
 * NESTIQ — Express App
 *
 * Configures middleware and mounts routes. Exported separately from
 * server.js so it can be imported in tests without binding a port.
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");
const interactionRoutes = require("./routes/interactionRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// ── Global middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN === "*" ? true : process.env.CORS_ORIGIN,
    credentials: true,
  })
);
// Raised to 10 MB to support Base64-encoded profile photo uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ── Health check ───────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "NESTIQ API is running." });
});

// ── Routes ───────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/interactions", interactionRoutes);

// ── 404 fallback ─────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` });
});

// ── Centralized error handler (must be last) ─────────────────────────
app.use(errorHandler);

module.exports = app;
