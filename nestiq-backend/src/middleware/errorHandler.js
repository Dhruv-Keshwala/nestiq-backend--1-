/**
 * NESTIQ — Centralized Error Handler
 *
 * Mounted last in server.js. Any controller that calls next(err)
 * or throws inside an async route (wrapped by asyncHandler) lands here.
 */

function errorHandler(err, req, res, next) {
  console.error("🔥 Unhandled error:", err);

  // Postgres unique-violation (e.g. duplicate email/phone) safety net —
  // controllers should already check this explicitly, but this catches
  // any race-condition double-submits.
  if (err.code === "23505") {
    return res.status(409).json({ success: false, message: "A record with this value already exists." });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Something went wrong on our end.",
  });
}

/**
 * Wrap an async route handler so thrown errors / rejected promises
 * are forwarded to errorHandler instead of crashing the process.
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { errorHandler, asyncHandler };
