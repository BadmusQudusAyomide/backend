const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/project"); // Add this line
const cors = require("cors");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // Important for reading JSON body

// Middleware to check if user is authenticated (optional but recommended)


// Define routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes); // Add this line to handle project routes

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
