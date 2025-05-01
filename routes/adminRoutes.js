const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middleware/authMiddleware");
const Project = require("../models/Project");
const User = require("../models/User");
const Challenge = require("../models/Challenge");
const Backup = require("../models/Backup");

// Create backup and reset challenge
router.post("/reset-with-backup", protect, isAdmin, async (req, res) => {
  try {
    // Create backup
    const backup = await createSystemBackup(req.user._id);

    // Reset challenge data
    await Project.deleteMany({});
    await User.updateMany(
      {},
      {
        $set: {
          totalPoints: 0,
          averageRating: 0,
          challengeStartDate: new Date(),
        },
      }
    );
    await Challenge.updateOne(
      { isActive: true },
      {
        $set: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Challenge reset with backup created",
      backupId: backup._id,
    });
  } catch (err) {
    console.error("Reset with backup failed:", err);
    res.status(500).json({
      success: false,
      message: "Reset operation failed",
      error: err.message,
    });
  }
});

// Get all backups
router.get("/backups", protect, isAdmin, async (req, res) => {
  try {
    const backups = await Backup.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "username email")
      .lean();

    res.status(200).json(backups);
  } catch (err) {
    console.error("Error fetching backups:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch backups",
      error: err.message,
    });
  }
});

// Restore from backup
router.post("/restore-backup/:id", protect, isAdmin, async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: "Backup not found",
      });
    }

    // Restore process
    await restoreFromBackup(backup);

    res.status(200).json({
      success: true,
      message: "System restored from backup successfully",
    });
  } catch (err) {
    console.error("Restore failed:", err);
    res.status(500).json({
      success: false,
      message: "Restore operation failed",
      error: err.message,
    });
  }
});

// Helper function to create system backup
async function createSystemBackup(adminId) {
  const currentChallenge = (await Challenge.findOne({ isActive: true })) || {};

  const backupData = {
    metadata: {
      challengePeriod: {
        start: currentChallenge.startDate,
        end: currentChallenge.endDate,
      },
    },
    statistics: {
      totalProjects: await Project.countDocuments(),
      totalParticipants: await User.countDocuments({ totalPoints: { $gt: 0 } }),
      averagePoints:
        (
          await User.aggregate([
            { $match: { totalPoints: { $gt: 0 } } },
            { $group: { _id: null, avg: { $avg: "$totalPoints" } } },
          ])
        )[0]?.avg || 0,
      topPerformers: await User.find()
        .sort({ totalPoints: -1 })
        .limit(5)
        .select("username fullName totalPoints profileImage")
        .lean(),
    },
  };

  return await Backup.create({
    name: `System Backup ${new Date().toLocaleString()}`,
    data: backupData,
    createdBy: adminId,
  });
}

// Helper function to restore from backup
async function restoreFromBackup(backup) {
  // Restore challenge dates if they exist
  if (backup.data.metadata?.challengePeriod) {
    await Challenge.updateOne(
      { isActive: true },
      {
        $set: {
          startDate: backup.data.metadata.challengePeriod.start,
          endDate: backup.data.metadata.challengePeriod.end,
        },
      }
    );
  }

  // Note: We don't restore projects as they were not stored in the backup
  // This is a "soft reset" that maintains the current state of projects
  // but restores the challenge parameters and statistics
}

// Update the restore function to actually restore data
async function restoreFromBackup(backup) {
  // 1. Restore challenge dates
  if (backup.data.metadata?.challengePeriod) {
    await Challenge.updateOne(
      { isActive: true },
      {
        $set: {
          startDate: new Date(backup.data.metadata.challengePeriod.start),
          endDate: new Date(backup.data.metadata.challengePeriod.end)
        }
      },
      { upsert: true }
    );
  }

  // 2. Reset user points to their state at backup time
  // Since we don't store individual user points in backup,
  // we'll reset all users to zero and update top performers
  await User.updateMany({}, {
    $set: {
      totalPoints: 0,
      averageRating: 0
    }
  });

  // 3. Restore top performers' points (if available)
  if (backup.data.statistics?.topPerformers) {
    for (const user of backup.data.statistics.topPerformers) {
      await User.updateOne(
        { _id: user._id },
        { $set: { totalPoints: user.totalPoints } }
      );
    }
  }
}

// Add this new endpoint to get backup details
router.get('/backups/:id', protect, isAdmin, async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id)
      .populate('createdBy', 'username email')
      .lean();

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: "Backup not found"
      });
    }

    res.status(200).json({
      success: true,
      backup
    });
  } catch (err) {
    console.error("Error fetching backup:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch backup",
      error: err.message
    });
  }
});

async function createSystemBackup(adminId) {
  const currentChallenge = (await Challenge.findOne({ isActive: true })) || {};
  const projects = await Project.countDocuments();
  const participants = await User.countDocuments({ totalPoints: { $gt: 0 } });

  // Get more detailed stats
  const stats = await User.aggregate([
    {
      $match: { totalPoints: { $gt: 0 } },
    },
    {
      $group: {
        _id: null,
        avgPoints: { $avg: "$totalPoints" },
        maxPoints: { $max: "$totalPoints" },
        minPoints: { $min: "$totalPoints" },
        totalPoints: { $sum: "$totalPoints" },
      },
    },
  ]);

  const backupData = {
    metadata: {
      challengePeriod: {
        start: currentChallenge.startDate,
        end: currentChallenge.endDate,
      },
      systemStats: {
        totalUsers: await User.countDocuments(),
        activeUsers: participants,
        inactiveUsers: await User.countDocuments({ totalPoints: 0 }),
      },
    },
    statistics: {
      totalProjects: projects,
      totalParticipants: participants,
      averagePoints: stats[0]?.avgPoints || 0,
      maxPoints: stats[0]?.maxPoints || 0,
      minPoints: stats[0]?.minPoints || 0,
      totalPoints: stats[0]?.totalPoints || 0,
      topPerformers: await User.find()
        .sort({ totalPoints: -1 })
        .limit(5)
        .select("_id username fullName totalPoints profileImage")
        .lean(),
    },
  };

  return await Backup.create({
    name: `System Backup ${new Date().toLocaleString()}`,
    data: backupData,
    createdBy: adminId,
  });
}
module.exports = router;
