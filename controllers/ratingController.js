// controllers/ratingController.js
const Rating = require("../models/Rating");
const Project = require("../models/Project");
const User = require("../models/User");

// Submit or update a rating
// In controllers/ratingController.js

// controllers/ratingController.js
exports.submitRating = async (req, res) => {
  try {
    const { projectId, criteria, feedback } = req.body;
    const adminId = req.user.id;

    // Calculate total points from criteria (each criterion gives 1 point)
    const criteriaValues = Object.values(criteria).filter((value) => value > 0);
    const ratingPoints = criteriaValues.length; // This will be 5 if all criteria are rated

    // Check if the admin already rated this project
    let rating = await Rating.findOne({ project: projectId, ratedBy: adminId });
    let previousPoints = 0;

    if (rating) {
      // Calculate previous points before updating
      previousPoints = Object.values(rating.criteria)
        .filter((value) => value > 0)
        .length;
    }

    // Create or update rating
    if (rating) {
      rating.criteria = criteria;
      rating.feedback = feedback;
      await rating.save();
    } else {
      rating = await Rating.create({
        project: projectId,
        ratedBy: adminId,
        criteria,
        feedback,
      });
    }

    // Update the project's overall rating
    await updateProjectOverallRating(projectId);

    // Get the project to access basePoints
    const project = await Project.findById(projectId);
    if (project) {
      // Calculate net points to add: (new rating points - previous rating points)
      const pointsToAdd = ratingPoints - previousPoints;
      
      // Update user's points
      await User.findByIdAndUpdate(project.user, {
        $inc: { totalPoints: pointsToAdd }
      });
    }

    res.status(200).json({ success: true, message: "Rating submitted successfully", rating });
  } catch (err) {
    // ... error handling ...
  }
};

// Function to update user points
// controllers/ratingController.js
async function updateUserPoints(userId, pointsToAdd) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Initialize totalPoints if not set
    if (typeof user.totalPoints !== 'number') {
      user.totalPoints = 0;
    }

    // Add the points (can be negative if removing points)
    user.totalPoints += pointsToAdd;

    // Ensure we don't go below zero
    user.totalPoints = Math.max(0, user.totalPoints);

    await user.save();
  } catch (err) {
    console.error("Error updating user points:", err);
  }
}

// Add new function to update user points
async function updateUserPoints(userId, pointsToAdd) {
  try {
    // Find the user
    const user = await User.findById(userId);
    if (user) {
      // Add new points to the user's total
      user.totalPoints = (user.totalPoints || 0) + pointsToAdd;
      
      // Update user's projects average rating for backward compatibility
      const userProjects = await Project.find({
        user: userId,
        status: "submitted",
      });

      const ratedProjects = userProjects.filter((p) => p.rating > 0);

      if (ratedProjects.length > 0) {
        const totalProjectRatings = ratedProjects.reduce(
          (sum, p) => sum + p.rating,
          0
        );
        const userAverageRating = totalProjectRatings / ratedProjects.length;
        user.averageRating = parseFloat(userAverageRating.toFixed(2));
      }
      
      await user.save();
    }
  } catch (err) {
    console.error("Error updating user points:", err);
  }
}
// Update project's overall rating based on all ratings it received
async function updateProjectOverallRating(projectId) {
  try {
    const ratings = await Rating.find({ project: projectId });

    if (ratings.length > 0) {
      const totalRatings = ratings.reduce((sum, r) => sum + r.averageRating, 0);
      const averageRating = totalRatings / ratings.length;

      const project = await Project.findById(projectId);
      if (project) {
        project.rating = parseFloat(averageRating.toFixed(2));
        project.ratingCount = ratings.length;
        await project.save();
      }
    }
  } catch (err) {
    console.error("Error updating project overall rating:", err);
  }
}

// Update user's average score based on all their projects' ratings
async function updateUserScore(userId) {
  try {
    const userProjects = await Project.find({
      user: userId,
      status: "submitted",
    });

    const ratedProjects = userProjects.filter((p) => p.rating > 0);

    if (ratedProjects.length > 0) {
      const totalProjectRatings = ratedProjects.reduce(
        (sum, p) => sum + p.rating,
        0
      );
      const userAverageRating = totalProjectRatings / ratedProjects.length;

      const user = await User.findById(userId);
      if (user) {
        user.averageRating = parseFloat(userAverageRating.toFixed(2));
        await user.save();
      }
    }
  } catch (err) {
    console.error("Error updating user score:", err);
  }
}

// Get all ratings for a project
exports.getProjectRatings = async (req, res) => {
  try {
    const { projectId } = req.params;

    const ratings = await Rating.find({ project: projectId }).populate(
      "ratedBy",
      "username fullName email"
    );

    res.status(200).json({
      success: true,
      count: ratings.length,
      ratings,
    });
  } catch (err) {
    console.error("Error fetching ratings:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ratings",
      error: err.message,
    });
  }
};

// In ratingController.js
exports.getProjectRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ project: req.params.projectId })
      .populate('ratedBy', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      ratings
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings',
      error: err.message
    });
  }
};