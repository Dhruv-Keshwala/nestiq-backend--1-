/**
 * NESTIQ — Interaction Controller
 *
 * Implements endpoints to get/toggle likes and favorites.
 */

const interactionModel = require("../models/interactionModel");
const { asyncHandler } = require("../middleware/errorHandler");

const getInteractions = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  const favorites = await interactionModel.getFavorites(userId);
  const likes = await interactionModel.getLikes(userId);
  res.json({
    success: true,
    data: { favorites, likes }
  });
});

const toggleFavorite = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  const { propertyId } = req.body;
  if (!propertyId) {
    return res.status(400).json({ success: false, message: "Missing propertyId." });
  }

  const favorites = await interactionModel.getFavorites(userId);
  const isFav = favorites.includes(String(propertyId));

  if (isFav) {
    await interactionModel.removeFavorite(userId, propertyId);
  } else {
    await interactionModel.addFavorite(userId, propertyId);
  }

  res.json({
    success: true,
    data: { saved: !isFav }
  });
});

const toggleLike = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  const { propertyId } = req.body;
  if (!propertyId) {
    return res.status(400).json({ success: false, message: "Missing propertyId." });
  }

  const likes = await interactionModel.getLikes(userId);
  const isLiked = likes.includes(String(propertyId));

  if (isLiked) {
    await interactionModel.removeLike(userId, propertyId);
  } else {
    await interactionModel.addLike(userId, propertyId);
  }

  res.json({
    success: true,
    data: { liked: !isLiked }
  });
});

module.exports = {
  getInteractions,
  toggleFavorite,
  toggleLike
};
