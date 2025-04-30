const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middleware/authMiddleware");
const {
  submitProject,
  getAllProjects,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");
const Project = require("../models/Project");

// Project submission route
router.post("/", protect, submitProject);

// Get all projects (admin only)
router.get("/all", protect, isAdmin, getAllProjects);

// Get current user's projects
router.get("/my-projects", protect, getUserProjects);

// Add the count route BEFORE the :id route
router.get("/count", protect, isAdmin, async (req, res) => {
  try {
    const count = await Project.estimatedDocumentCount();
    res.status(200).json({
      success: true,
      count,
    });
  } catch (err) {
    console.error("Error counting projects:", err);
    res.status(500).json({
      success: false,
      message: "Error counting projects",
      error: err.message,
    });
  }
});

// Get specific user's projects (admin only)
router.get("/user/:userId", protect, isAdmin, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.params.userId }).sort({
      submissionDate: -1,
    }); // Removed .limit(2)

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (err) {
    console.error("Error fetching user projects:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

// Get project count for a user (admin only)

router.get("/user/:userId/count", protect, isAdmin, async (req, res) => {
  try {
    const count = await Project.countDocuments({ user: req.params.userId });
    res.status(200).json({
      success: true,
      count,
    });
  } catch (err) {
    console.error("Error counting user projects:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

// In your routes file (probably routes/projectRoutes.js)
router.get('/project/:projectId/ratings', protect, async (req, res) => {
  try {
    const ratings = await Rating.find({ projectId: req.params.projectId })
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
});





// Dynamic routes should come LAST
router.get("/:id", protect, getProjectById);
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);

module.exports = router;
