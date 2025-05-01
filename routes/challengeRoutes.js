const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middleware/authMiddleware");
const Challenge = require("../models/Challenge");
const { Parser } = require('json2csv');



// Get previous challenge
router.get("/previous", async (req, res) => {
  try {
    const challenge = await Challenge.findOne({ isActive: false }).sort({ endDate: -1 });
    res.json({ success: true, challenge });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/challenge/current-day
router.get("/current-day", protect, async (req, res) => {
  try {
    let challenge = await Challenge.findOne({ isActive: true }).sort({
      startDate: -1,
    });

    // Get current time in West Africa Time (UTC+1)
    const now = new Date();
    const watOffset = 60 * 60 * 1000; // UTC+1 in milliseconds
    const watNow = new Date(now.getTime() + watOffset);

    // If no active challenge exists, create a new one
    if (!challenge) {
      const newStartDate = new Date(watNow);
      const newEndDate = new Date(watNow);
      newEndDate.setDate(newEndDate.getDate() + 30);

      challenge = await Challenge.create({
        name: "New 30-Day Challenge",
        startDate: newStartDate,
        endDate: newEndDate,
        isActive: true,
        breakDays: 2,
        duration: 30,
        description: "Auto-started new challenge.",
      });

      return res.status(200).json({ success: true, day: 1 });
    }

    // Check if challenge is over (using WAT)
    if (watNow > challenge.endDate) {
      const afterBreakDate = new Date(challenge.endDate);
      afterBreakDate.setDate(afterBreakDate.getDate() + challenge.breakDays);

      if (watNow >= afterBreakDate) {
        const newStartDate = new Date(watNow);
        const newEndDate = new Date(watNow);
        newEndDate.setDate(newEndDate.getDate() + challenge.duration);

        challenge.isActive = false;
        await challenge.save();

        await Challenge.create({
          name: "New 30-Day Challenge",
          startDate: newStartDate,
          endDate: newEndDate,
          isActive: true,
          breakDays: 2,
          duration: 30,
          description: "Auto-started new challenge.",
        });

        return res.status(200).json({ success: true, day: 1 });
      } else {
        return res.status(200).json({
          success: true,
          day: 0,
          message: "Break time before next challenge starts.",
        });
      }
    }

    // Calculate current day in WAT
    const startDate = new Date(challenge.startDate);
    const day = Math.floor((watNow - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const currentDay = Math.min(Math.max(day, 1), challenge.duration);

    res.status(200).json({
      success: true,
      day: currentDay,
      timezone: "WAT (UTC+1)", // For debugging
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.get("/active", async (req, res) => {
  try {
    const challenge = await Challenge.findOne({ isActive: true }).sort({
      startDate: -1,
    });
    res.json({ success: true, challenge });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/:id/export", protect, isAdmin, async (req, res) => {
  try {
    // Verify challenge exists
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found",
      });
    }

    // Get projects with user data
    const projects = await Project.find({ challenge: req.params.id })
      .populate("user", "username email")
      .lean();

    if (!projects.length) {
      return res.status(404).json({
        success: false,
        message: "No projects found for this challenge",
      });
    }

    // Prepare CSV data
    const fields = [
      { label: "Day", value: "day" },
      { label: "Project Name", value: "projectName" },
      { label: "User", value: "user.username" },
      { label: "Email", value: "user.email" },
      { label: "Submitted On", value: "submissionDate" },
      { label: "Status", value: "status" },
      { label: "Languages", value: "languages" },
      { label: "Live URL", value: "liveLink" },
      { label: "Repo URL", value: "repoLink" },
    ];

    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(projects);

    // Set headers and send CSV
    res.header("Content-Type", "text/csv");
    res.attachment(`challenge_${challenge.name.replace(/\s+/g, "_")}_data.csv`);
    return res.send(csv);
  } catch (err) {
    console.error("Export error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to generate CSV export",
      error: err.message,
    });
  }
});

// Add this route with your other user management routes
router.get("/users/:id", protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching user",
      error: err.message 
    });
  }
});

// In your routes file (e.g., challengeRoutes.js or adminRoutes.js)
router.post("/reset-challenge", protect, isAdmin, async (req, res) => {
  try {
    // 1. Reset all projects
    await Project.deleteMany({});
    
    // 2. Reset user challenge-related data but keep accounts
    await User.updateMany({}, {
      $set: {
        totalPoints: 0,
        averageRating: 0,
        // Add any other challenge-specific fields you want to reset
      }
    });
    
    // 3. Reset challenge status if you have a Challenge model
    await Challenge.updateOne(
      { isActive: true },
      {
        $set: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          // Reset other challenge fields as needed
        }
      }
    );
    
    res.status(200).json({
      success: true,
      message: "Challenge has been reset successfully",
    });
  } catch (err) {
    console.error("Error resetting challenge:", err);
    res.status(500).json({
      success: false,
      message: "Failed to reset challenge",
      error: err.message,
    });
  }
});


module.exports = router;
