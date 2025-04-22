const Project = require("../models/Project");
const User = require("../models/User");

// Create/submit a new project
exports.submitProject = async (req, res) => {
  try {
    const {
      projectName,
      liveLink,
      repoLink,
      description,
      day,
      frameworks,
      languages,
      imageUrl, // This will be provided after image upload
    } = req.body;

    // Create the project
    const project = new Project({
      user: req.user.id,
      projectName,
      liveLink,
      repoLink,
      description,
      day: parseInt(day),
      frameworks,
      languages,
      imageUrl,
      submissionDate: new Date(),
    });

    await project.save();

    res.status(201).json({
      success: true,
      message: "Project submitted successfully",
      project,
    });
  } catch (err) {
    console.error("Error submitting project:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// Get all projects (admin only)
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("user", "username email")
      .sort({ submissionDate: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// Get current user's projects
exports.getUserProjects = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id }).sort({ day: 1 });

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
};

// Get project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "user",
      "username email"
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if the project belongs to the user or if the user is an admin
    if (project.user._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this project",
      });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if the project belongs to the user
    if (project.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this project",
      });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if the project belongs to the user or if the user is an admin
    if (project.user.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this project",
      });
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
