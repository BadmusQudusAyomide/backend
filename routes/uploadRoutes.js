const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Route for uploading project images
router.post(
  "/project-image",
  protect,
  upload.single("projectImage"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Return the Cloudinary URL
      res.status(200).json({
        success: true,
        imageUrl: req.file.path,
      });
    } catch (err) {
      console.error("Error uploading image:", err);
      res.status(500).json({
        success: false,
        message: "Error uploading image",
        error: err.message,
      });
    }
  }
);

module.exports = router;
