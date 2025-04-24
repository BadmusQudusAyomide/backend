const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, 
      unique: true, 
      // sparse: true, 
      trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/
   },
      
    fullName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },

    // Additional fields for profile
    bio: { type: String },
    location: { type: String },
    website: { type: String },
    profileImage: { type: String },
    theme: { type: String, default: "light" },

    // Activity tracking
    lastActive: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },

    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// Update lastActive timestamp on login
userSchema.methods.updateLastActive = function () {
  this.lastActive = new Date();
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
