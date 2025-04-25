const express = require("express");
const router = express.Router();
const passport = require("passport");
const {
  signup,
  login,
  updateProfile,
} = require("../controllers/authController");
const { protect, isAdmin } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Project = require("../models/Project");
const jwt = require("jsonwebtoken");

// Utility: Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// Signup & Login routes
router.post("/signup", signup);
router.post("/login", login);

// Admin signup route
router.post("/admin-signup", async (req, res) => {
  try {
    const { fullName, username, email, password, adminKey } = req.body;

    if (adminKey !== process.env.ADMIN_REGISTRATION_KEY) {
      return res
        .status(403)
        .json({ message: "Invalid admin registration key" });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    if (username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const user = await User.create({
      fullName,
      username,
      email,
      password,
      isAdmin: true,
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        token,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Admin registration failed", error: err.message });
  }
});

// Update profile route
router.put("/profile", protect, updateProfile);

// Protected profile route
// In your auth routes
 // In your auth routes
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user: {
        ...user,
        isAdmin: user.isAdmin || false, // Ensure isAdmin is always present
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user data",
    });
  }
});

// Admin-only route
router.get("/admin-only", protect, isAdmin, (req, res) => {
  res.json({
    message: "You are an admin!",
    user: req.user,
  });
});

// Google OAuth Routes - Fixed Version
router.get("/google", (req, res, next) => {
  // Get the original path or default to dashboard
  const redirectPath = req.query.redirect || "/dashboard";

  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: JSON.stringify(redirectPath), // Store the original path
    prompt: "select_account",
  })(req, res, next);
});

// In your auth routes file
// In your auth routes file
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  (req, res) => {
    try {
      // Get the original redirect path or default to dashboard
      const redirectPath = req.query.state
        ? JSON.parse(req.query.state)
        : "/dashboard";

      if (!req.user?.token) {
        throw new Error("No token received");
      }

      // Redirect to frontend success handler
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/success?token=${
          req.user.token
        }&redirect=${encodeURIComponent(redirectPath)}`
      );
    } catch (err) {
      console.error("Google callback error:", err);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);

// User management routes
router.get("/users", protect, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/users/count", protect, isAdmin, async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.status(200).json({ success: true, count });
  } catch (err) {
    console.error("Error counting users:", err);
    res.status(500).json({ success: false, message: "Error counting users" });
  }
});

router.get("/users/active", protect, isAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await User.countDocuments({ lastActive: { $gte: today } });
    res.status(200).json({ success: true, count });
  } catch (err) {
    console.error("Error counting active users:", err);
    res
      .status(500)
      .json({ success: false, message: "Error counting active users" });
  }
});

// Helper function
async function calculateUserStats(userId) {
  try {
    const projectsSubmitted = await Project.countDocuments({
      user: userId,
      status: "submitted",
    });

    const user = await User.findById(userId).select("challengeStartDate");
    const startDate = user.challengeStartDate || new Date();
    const currentDay = Math.min(
      30,
      Math.floor((Date.now() - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
    );

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
// In your auth routes file
router.get('/verify-token', protect, (req, res) => {
  res.json({ isValid: true });
});
router.get("/verify-token", protect, (req, res) => {
  res.json({
    success: true,
    isAdmin: req.user.isAdmin || false,
    user: req.user
  });
});
module.exports = router;
