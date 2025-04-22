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

// Project submission route
router.post("/", protect, submitProject);

// Get all projects (admin only)
router.get("/all", protect, isAdmin, getAllProjects);

// Get current user's projects
router.get("/my-projects", protect, getUserProjects);

// Get, update, delete specific project
router.get("/:id", protect, getProjectById);
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);

module.exports = router;
