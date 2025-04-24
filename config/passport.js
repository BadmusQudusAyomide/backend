const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Helper function to generate random username
const generateUsername = (email, displayName) => {
  // Use email prefix or sanitized display name
  const base =
    email.split("@")[0] || displayName.toLowerCase().replace(/\s+/g, "");

  // Add random 4-digit number to ensure uniqueness
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  return `${base}${randomSuffix}`;
};

// In your passport configuration file
// In your passport Google strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        fullName: profile.displayName,
        email,
        profileImage: profile.photos[0]?.value,
        authMethod: 'google',
        isVerified: true
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Include basic user data in the token response
    done(null, { 
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (err) {
    done(err, null);
  }
}));