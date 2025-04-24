const jwt = require("jsonwebtoken");

// Token generator
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET, // Make sure you have this in your .env
    { expiresIn: "30d" }
  );
};
