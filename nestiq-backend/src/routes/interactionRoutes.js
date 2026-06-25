/**
 * NESTIQ — Interaction Routes
 *
 * Defines routes under /api/interactions.
 */

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getInteractions, toggleFavorite, toggleLike } = require("../controllers/interactionController");

const router = express.Router();

// Require auth for all interactions
router.use(requireAuth);

router.get("/", getInteractions);
router.post("/favorite", toggleFavorite);
router.post("/like", toggleLike);

module.exports = router;
