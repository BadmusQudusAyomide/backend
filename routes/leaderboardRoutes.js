// In routes/leaderboardRoutes.js
const express = require("express");
const router = express.Router();
const { protect , isAdmin } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Project = require("../models/Project");
const mongoose = require("mongoose");


// Get leaderboard data with simplified metrics
router.get("/leaderboard", protect, async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();

    // Get all users with basic info including totalPoints
    const users = await User.find().select(
      "_id fullName username profileImage bio createdAt totalPoints"
    );

    // Get project stats for all users in one aggregation query
    const projectStats = await Project.aggregate([
      { $match: { status: "submitted" } },
      {
        $group: {
          _id: "$user",
          projectsSubmitted: { $sum: 1 },
          totalRating: { $sum: "$rating" },
          ratedProjectsCount: {
            $sum: { $cond: [{ $gt: ["$rating", 0] }, 1, 0] },
          },
          latestSubmission: { $max: "$submissionDate" },
        },
      },
    ]);

    // Create a map of user stats for quick lookup
    const statsMap = {};
    projectStats.forEach((stat) => {
      statsMap[stat._id.toString()] = stat;
    });

    // Calculate streak for each user
    const streakData = await calculateUserStreaks();

    // Process user data with their stats
    const usersWithStats = users.map((user) => {
      const userId = user._id.toString();
      const userStats = statsMap[userId] || {
        projectsSubmitted: 0,
        totalRating: 0,
        ratedProjectsCount: 0,
      };

      // Calculate average rating for display
      const averageRating =
        userStats.ratedProjectsCount > 0
          ? userStats.totalRating / userStats.ratedProjectsCount
          : 0;

      const userStreak = streakData[userId] || {
        currentStreak: 0,
        maxStreak: 0,
      };

      return {
        id: userId,
        name: user.fullName || user.username || "Anonymous User",
        username: user.username,
        avatar: user.profileImage || null, // Only return actual profile image or null
        projectsSubmitted: userStats.projectsSubmitted || 0,
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalPoints: user.totalPoints || 0,
        streak: userStreak.currentStreak || 0,
        maxStreak: userStreak.maxStreak || 0,
        isCurrentUser: userId === currentUserId,
        latestSubmission: userStats.latestSubmission || null,
      };
    });

    // Sort users by totalPoints descending (primary) and number of projects (secondary)
    const sortedUsers = usersWithStats.sort((a, b) => {
      if (b.totalPoints === a.totalPoints) {
        return b.projectsSubmitted - a.projectsSubmitted;
      }
      return b.totalPoints - a.totalPoints;
    });

    res.status(200).json({
      success: true,
      data: sortedUsers,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Error fetching leaderboard data:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard data",
      error: err.message,
    });
  }
});

// Helper function to calculate user streaks
async function calculateUserStreaks() {
  const streakData = {};

  try {
    // Get all users
    const users = await User.find().select("_id");

    for (const user of users) {
      const userId = user._id;

      // Get all submissions for this user, sorted by date
      const submissions = await Project.find({
        user: userId,
        status: "submitted",
      })
        .sort({ submissionDate: 1 })
        .select("submissionDate");

      if (submissions.length === 0) {
        streakData[userId.toString()] = { currentStreak: 0, maxStreak: 0 };
        continue;
      }

      // Calculate streak by checking consecutive days
      let currentStreak = 1;
      let maxStreak = 1;
      let prevDate = new Date(submissions[0].submissionDate);

      for (let i = 1; i < submissions.length; i++) {
        const currentDate = new Date(submissions[i].submissionDate);

        // Check if dates are consecutive days
        const diffTime = Math.abs(currentDate - prevDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else if (diffDays > 1) {
          // Streak broken
          currentStreak = 1;
        }

        prevDate = currentDate;
      }

      // Check if streak is still active (submission within last 24 hours)
      const lastSubmission = new Date(
        submissions[submissions.length - 1].submissionDate
      );
      const now = new Date();
      const timeSinceLastSubmission = Math.abs(now - lastSubmission);
      const daysSinceLastSubmission = Math.ceil(
        timeSinceLastSubmission / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastSubmission > 1) {
        currentStreak = 0;
      }

      streakData[userId.toString()] = { currentStreak, maxStreak };
    }

    return streakData;
  } catch (error) {
    console.error("Error calculating streaks:", error);
    return {};
  }
}

// Add this to your leaderboardRoutes.js
router.get("/export", protect, isAdmin, async (req, res) => {
  try {
    // Get leaderboard data
    const leaderboardData = await getLeaderboardData();

    // Prepare CSV data
    const fields = [
      { label: "Rank", value: "rank" },
      { label: "Name", value: "name" },
      { label: "Username", value: "username" },
      { label: "Projects Submitted", value: "projectsSubmitted" },
      { label: "Average Rating", value: "averageRating" },
      { label: "Total Points", value: "totalPoints" },
      { label: "Current Streak", value: "streak" },
      { label: "Max Streak", value: "maxStreak" },
      { label: "Last Submission", value: "latestSubmission" },
    ];

    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(leaderboardData);

    // Set headers and send CSV
    res.header("Content-Type", "text/csv");
    res.attachment(`leaderboard_export_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error("Leaderboard export error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to generate leaderboard CSV export",
      error: err.message,
    });
  }
});

async function getLeaderboardData() {
  try {
    // Get all users with basic info including totalPoints
    const users = await User.find().select(
      "_id fullName username profileImage bio createdAt totalPoints"
    );

    // Get project stats for all users in one aggregation query
    const projectStats = await Project.aggregate([
      { $match: { status: "submitted" } },
      {
        $group: {
          _id: "$user",
          projectsSubmitted: { $sum: 1 },
          totalRating: { $sum: "$rating" },
          ratedProjectsCount: {
            $sum: { $cond: [{ $gt: ["$rating", 0] }, 1, 0] },
          },
          latestSubmission: { $max: "$submissionDate" },
        },
      },
    ]);

    // Create a map of user stats for quick lookup
    const statsMap = {};
    projectStats.forEach((stat) => {
      statsMap[stat._id.toString()] = stat;
    });

    // Calculate streak for each user
    const streakData = await calculateUserStreaks();

    // Process user data with their stats
    const usersWithStats = users.map((user) => {
      const userId = user._id.toString();
      const userStats = statsMap[userId] || {
        projectsSubmitted: 0,
        totalRating: 0,
        ratedProjectsCount: 0,
      };

      // Calculate average rating for display
      const averageRating =
        userStats.ratedProjectsCount > 0
          ? userStats.totalRating / userStats.ratedProjectsCount
          : 0;

      const userStreak = streakData[userId] || {
        currentStreak: 0,
        maxStreak: 0,
      };

      return {
        name: user.fullName || user.username || "Anonymous User",
        username: user.username,
        projectsSubmitted: userStats.projectsSubmitted || 0,
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalPoints: user.totalPoints || 0,
        streak: userStreak.currentStreak || 0,
        maxStreak: userStreak.maxStreak || 0,
        latestSubmission: userStats.latestSubmission || null,
      };
    });

    // Sort users by totalPoints descending (primary) and number of projects (secondary)
    const sortedUsers = usersWithStats.sort((a, b) => {
      if (b.totalPoints === a.totalPoints) {
        return b.projectsSubmitted - a.projectsSubmitted;
      }
      return b.totalPoints - a.totalPoints;
    });

    // Add rank to each user
    return sortedUsers.map((user, index) => ({
      rank: index + 1,
      ...user,
      latestSubmission: user.latestSubmission 
        ? new Date(user.latestSubmission).toLocaleString()
        : "Never",
    }));
  } catch (error) {
    console.error("Error getting leaderboard data:", error);
    return [];
  }
}

module.exports = router;
