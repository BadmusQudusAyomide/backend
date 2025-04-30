const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Invalid token format",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.log("User not found in database");
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    user.lastActive = new Date();
    await user.save();

    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: err.message, // Include specific error message
    });
  }
};

const isAdmin = (req, res, next) => {
  console.log("Checking admin status for user:", req.user?.email); // Debug log
  if (req.user && req.user.isAdmin) {
    console.log("Admin access granted");
    next();
  } else {
    console.log("Admin access denied");
    return res.status(403).json({
      success: false,
      message: "Admin access denied",
      userIsAdmin: req.user?.isAdmin,
    });
  }
};
module.exports = { protect, isAdmin };
