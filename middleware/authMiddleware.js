const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Auth Middleware (for logged-in users)
// In your authMiddleware.js, add more detailed logging
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Update last active time
      req.user.lastActive = new Date();
      await req.user.save();

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }
};

// Admin Middleware (must be logged in and isAdmin === true)
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(403).json({ message: "Admin access denied" });
  }
};

module.exports = { protect, isAdmin };
