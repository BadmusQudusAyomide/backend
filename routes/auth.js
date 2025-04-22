const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/authController");
const { protect, isAdmin } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Project = require("../models/Project"); // Assuming you have a Project model
const authController = require("../controllers/authController"); 

// Authentication routes
router.post("/signup", signup);
router.post("/login", login);

router.put("/profile", protect, authController.updateProfile);

// Protected user profile route
router.get("/me", protect, async (req, res) => {
  try {
    // Get user document without password
    const user = await User.findById(req.user.id).select("-password").lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate challenge statistics
    const stats = await calculateUserStats(req.user.id);

    res.json({
      user,
      stats,
    });
  } catch (err) {
    console.error("Error in /me endpoint:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
  
});

// Admin-only route
router.get("/admin-only", protect, isAdmin, (req, res) => {
  res.json({
    message: "You are an admin!",
    user: req.user,
  });
});

// Helper function to calculate user statistics
async function calculateUserStats(userId) {
  try {
    // Count user's submitted projects
    const projectsSubmitted = await Project.countDocuments({
      user: userId,
      status: "submitted",
    });

    // Calculate current day of challenge (1-30)
    const user = await User.findById(userId).select("challengeStartDate");
    const startDate = user.challengeStartDate || new Date();
    const currentDay = Math.min(
      30,
      Math.floor((Date.now() - startDate) / (1000 * 60 * 60 * 24)) + 1
    );

    // Calculate user's rank based on submitted projects
    const totalParticipants = await User.countDocuments();
    const usersWithMoreProjects = await User.countDocuments({
      "stats.projectsSubmitted": { $gt: projectsSubmitted },
    });
    const rank =
      projectsSubmitted > 0 ? usersWithMoreProjects + 1 : totalParticipants;

    return {
      projectsSubmitted,
      currentDay,
      totalParticipants,
      rank,
      completionPercentage: Math.round((currentDay / 30) * 100),
    };
  } catch (err) {
    console.error("Error calculating user stats:", err);
    return {
      projectsSubmitted: 0,
      currentDay: 1,
      totalParticipants: 0,
      rank: 0,
      completionPercentage: 0,
    };
  }
}

module.exports = router;
