const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middleware/authMiddleware");
const Challenge = require("../models/Challenge");

// GET /api/challenge/current-day
router.get("/current-day", protect, isAdmin, async (req, res) => {
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

module.exports = router;
