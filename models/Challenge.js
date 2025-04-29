const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    version: { type: Number, default: 1 }, // Add version tracking
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    description: { type: String },
    breakDays: { type: Number, default: 2 },
    duration: { type: Number, default: 30 },
  },
  { timestamps: true }
);

// Auto-increment version when creating new challenge
challengeSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastChallenge = await this.constructor.findOne().sort({ version: -1 });
    this.version = lastChallenge ? lastChallenge.version + 1 : 1;
  }
  next();
});

module.exports = mongoose.model("Challenge", challengeSchema);