// server/services/tokens.js
const TokenBlacklist = require("../models/TokenBlacklist");

// Check if token is blacklisted
const checkTokenBlacklist = async (token) => {
  const blacklistedToken = await TokenBlacklist.findOne({ token });
  return !!blacklistedToken;
};

// Add token to blacklist
const addToBlacklist = async (token) => {
  await TokenBlacklist.create({ token });
};

module.exports = {
  checkTokenBlacklist,
  addToBlacklist,
};
