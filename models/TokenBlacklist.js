// server/models/TokenBlacklist.js
const mongoose = require("mongoose");

const tokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "30d", // Automatically remove expired tokens
  },
});

module.exports = mongoose.model("TokenBlacklist", tokenBlacklistSchema);
