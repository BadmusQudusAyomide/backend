require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

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

// The rest of your existing setup
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));

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
