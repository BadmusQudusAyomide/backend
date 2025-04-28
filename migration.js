// Create a migration.js script

const mongoose = require("mongoose");
const User = require("./models/User");
const Project = require("./models/Project");
const Rating = require("./models/Rating");
require("dotenv").config();

async function migrateToPointsSystem() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database");

    // Get all users
    const users = await User.find();
    console.log(`Found ${users.length} users to migrate`);

    for (const user of users) {
      let totalPoints = 0;

      // Get all projects for this user
      const projects = await Project.find({ user: user._id });

      for (const project of projects) {
        // Get all ratings for this project
        const ratings = await Rating.find({ project: project._id });

        // Sum up all criteria points for this project
        for (const rating of ratings) {
          const criteriaPoints = Object.values(rating.criteria)
            .filter((value) => value > 0)
            .reduce((sum, val) => sum + val, 0);

          totalPoints += criteriaPoints;
        }
      }

      // Update user with total points
      user.totalPoints = totalPoints;
      await user.save();
      console.log(`Migrated user ${user._id}: ${totalPoints} points`);
    }

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
}

migrateToPointsSystem();
