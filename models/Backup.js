const mongoose = require("mongoose");

const backupSchema = new mongoose.Schema(
  {
    name: String,
    data: {
      metadata: Object,
      statistics: Object,
    },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Backup", backupSchema);
