const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const GitHubStrategy = require('passport-github2').Strategy;


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
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            fullName: profile.displayName,
            email,
            username: generateUsername(email, profile.displayName),
            profileImage: profile.photos[0]?.value,
            authMethod: "google",
            isVerified: true,
          });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });

        done(null, {
          token,
          user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            authMethod: user.authMethod,
          },
        });
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
  scope: ['user:email'] // Request email scope
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // GitHub may not always provide email, so we need to handle that
    // In your GitHub strategy
    const email =
      profile.emails?.[0]?.value ||
      `${profile.username}@users.noreply.github.com`;
    const username =
      profile.username ||
      generateUsername(email, profile.displayName || "githubuser");

    let user = await User.findOne({
      $or: [{ githubId: profile.id }, { email: email }],
    });

    if (!user) {
      user = await User.create({
        fullName: profile.displayName || profile.username,
        username: profile.username, // GitHub username
        email: email,
        githubId: profile.id,
        profileImage: profile.photos?.[0]?.value,
        authMethod: "github",
        isVerified: true,
      });
    } else if (!user.githubId) {
      // User exists but didn't have GitHub auth - link it
      user.githubId = profile.id;
      user.authMethod = "github";
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    done(null, {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        authMethod: user.authMethod,
      },
    });
  } catch (err) {
    done(err, null);
  }
}));
