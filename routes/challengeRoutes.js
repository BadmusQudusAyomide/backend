const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const Challenge = require('../models/Challenge');

// Get current challenge day
// In challengeRoutes.js
router.get('/current-day', protect, isAdmin, async (req, res) => {
  try {
    // Default to current date if no challenge exists
    const startDate = new Date(); 
    const today = new Date();
    const day = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const currentDay = Math.min(Math.max(day, 1), 30);
    
    res.status(200).json({ 
      success: true, 
      day: currentDay 
    });
  } catch (err) {
    res.status(200).json({ 
      success: true, 
      day: 1 // Default to day 1 if error
    });
  }
});

module.exports = router;