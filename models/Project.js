const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    liveLink: {
      type: String,
      required: true,
      trim: true,
    },
    repoLink: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    day: {
      type: Number,
      required: true,
      min: 1,
      max: 30,
    },
    frameworks: {
      type: String,
      trim: true,
    },
    languages: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved"],
      default: "submitted",
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
