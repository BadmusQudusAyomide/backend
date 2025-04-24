const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Auth Middleware (for logged-in users)
// In your authMiddleware.js, add more detailed logging
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Auth header received:", authHeader);

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    console.log("Extracted token:", token);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded successfully:", decoded);
      req.user = await User.findById(decoded.id).select("-password");
      
      if (!req.user) {
        console.log("User not found for ID:", decoded.id);
        return res.status(401).json({ message: "User not found" });
      }
      
      next();
    } catch (err) {
      console.error("Token verification error:", err);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } else {
    console.log("No valid auth header found");
    return res.status(401).json({ message: "No token provided" });
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
