const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  day: Number,
  liveLink: String,
  repoLink: String,
  description: String,
  image: String,
  frameworks: [String],
  languages: [String],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  dateSubmitted: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Project", projectSchema);
