const mongoose = require("mongoose");


const challengeSchema = new mongoose.Schema(
  {
    name: String,
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    isActive: { type: Boolean, default: true },
    description: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Challenge", challengeSchema);

module.exports = mongoose.model("Challenge", challengeSchema);
