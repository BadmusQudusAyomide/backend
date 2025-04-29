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

    const today = new Date();

    // If no active challenge exists, create a new one
    if (!challenge) {
      const newStartDate = today;
      const newEndDate = new Date(today);
      newEndDate.setDate(newEndDate.getDate() + 30); // 30 days duration

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

    // Check if challenge is over
    if (today > challenge.endDate) {
      const afterBreakDate = new Date(challenge.endDate);
      afterBreakDate.setDate(afterBreakDate.getDate() + challenge.breakDays);

      // If break days have passed, start a new challenge
      if (today >= afterBreakDate) {
        const newStartDate = today;
        const newEndDate = new Date(today);
        newEndDate.setDate(newEndDate.getDate() + challenge.duration);

        // Mark old challenge as inactive
        challenge.isActive = false;
        await challenge.save();

        // Create new challenge
        const newChallenge = await Challenge.create({
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
        // Still in break period
        return res
          .status(200)
          .json({
            success: true,
            day: 0,
            message: "Break time before next challenge starts.",
          });
      }
    }

    // If challenge is still running
    const startDate = new Date(challenge.startDate);
    const day = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const currentDay = Math.min(Math.max(day, 1), challenge.duration);

    res.status(200).json({ success: true, day: currentDay });
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


module.exports = router;
