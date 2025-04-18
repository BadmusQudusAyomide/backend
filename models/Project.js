const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  day: {
    type: Number,
    required: true,
    min: 1,
    max: 30,
  },
  status: {
    type: String,
    enum: ["draft", "submitted", "approved"],
    default: "draft",
  },
  submissionDate: Date,
  // ... other project fields ...
});

module.exports = mongoose.model("Project", projectSchema);
