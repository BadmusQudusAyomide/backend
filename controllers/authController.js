const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Signup
exports.signup = async (req, res) => {
  const { fullName, email, password, username } = req.body;
 
  try {
    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already in use" });
    }
    // Check if username exists (if provided)
    if (username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }
    const user = await User.create({ fullName, email, password, username });
   
    res.status(201).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user),
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { emailOrUsername, password } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });
    if (!user) return res.status(400).json({ message: "User not found" });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });
    
    res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        bio: user.bio,
        location: user.location,
        website: user.website,
        profileImage: user.profileImage,
        theme: user.theme,
        notifications: user.notifications,
        token: generateToken(user),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      fullName,
      username,
      bio,
      location,
      website,
      theme,
      notifications,
      // Do not allow password or email updates through this route
    } = req.body;

    // If username is changing, check if it already exists
    if (username && username !== req.user.username) {
      const usernameExists = await User.findOne({ 
        username, 
        _id: { $ne: userId } // Exclude current user from check
      });
      
      if (usernameExists) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    // Get current user and update fields
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update only the fields that are provided
    if (fullName !== undefined) user.fullName = fullName;
    if (username !== undefined) user.username = username;
    
    // Update optional fields if provided
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (theme !== undefined) user.theme = theme;
    if (notifications !== undefined) user.notifications = notifications;

    // Save the updated user
    await user.save();

    // Return updated user data (excluding password)
    const userData = user.toObject();
    delete userData.password;

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        ...userData,
        token: req.headers.authorization.split(" ")[1], // Return the same token
      }
    });
  } catch (err) {
    res.status(500).json({ 
      message: "Profile update failed", 
      error: err.message 
    });
  }
};