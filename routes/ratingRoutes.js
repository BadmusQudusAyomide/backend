// routes/ratingRoutes.js
const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middleware/authMiddleware");
const {
  submitRating,
  getProjectRatings,
} = require("../controllers/ratingController");

// Admin-only routes
router.post("/submit", protect, isAdmin, submitRating);
router.get("/project/:projectId", protect, getProjectRatings);

module.exports = router;
