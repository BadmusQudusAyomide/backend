// server/userMigration.js
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const migrateUsers = async () => {
  try {
    // Connect to your database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Update all existing users
    const result = await User.updateMany(
      { 
        $or: [
          { lastActive: { $exists: false } },
          { isActive: { $exists: false } }
        ]
      },
      { 
        $set: { 
          lastActive: new Date(),
          isActive: true
        } 
      }
    );

    console.log(`Updated ${result.modifiedCount} users`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrateUsers();