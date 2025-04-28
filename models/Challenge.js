const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema(
  {
    name: { type: String },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    description: { type: String },
    breakDays: { type: Number, default: 2 }, // 2-day break after
    duration: { type: Number, default: 30 }, // 30-day challenge
  },
  { timestamps: true }
);

module.exports = mongoose.model("Challenge", challengeSchema);
