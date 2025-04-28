// models/Rating.js
const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Store each criterion rating
    criteria: {
      functionality: { type: Number, default: 0 },
      design: { type: Number, default: 0 },
      innovation: { type: Number, default: 0 },
      codeQuality: { type: Number, default: 0 },
      completeness: { type: Number, default: 0 },
    },
    // Store the calculated average rating
    averageRating: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Ensure one rating per project per admin
ratingSchema.index({ project: 1, ratedBy: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);
