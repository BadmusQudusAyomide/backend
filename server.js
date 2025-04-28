require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const challengeRoutes = require("./routes/challengeRoutes");
const app = express();

// Updated CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Your frontend URL
    credentials: true, // If you're using cookies/sessions
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const passport = require("passport");
require("./config/passport");

app.use(passport.initialize());
// Add this to your server.js before routes
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`Incoming ${req.method} request to ${req.originalUrl}`);
    console.log("Headers:", req.headers);
    next();
  });
}



// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/uploads", require("./routes/uploadRoutes"));
app.use('/api/challenge', challengeRoutes);
// Add this line to your routes section in server.js
app.use("/api/leaderboard", require("./routes/leaderboardRoutes"));
// In server.js
app.use("/api/ratings", require("./routes/ratingRoutes"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Server Error",
    error:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

// DB + Server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

