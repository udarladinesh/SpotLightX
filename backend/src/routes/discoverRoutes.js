const express = require('express');
const router = express.Router();
const {
  getFreshFeed,
  getTrendingFeed,
  getFollowingFeed
} = require('../controllers/discoverController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// ---------------------- Discovery Feed Routes ----------------------

// Public / Semi-Personalized: Fresh feed (sorted by newest createdAt)
router.get('/fresh', optionalAuth, getFreshFeed);

// Public / Semi-Personalized: Trending feed (rule-based engagement score with recency decay)
router.get('/trending', optionalAuth, getTrendingFeed);

// Protected: Following feed (videos from creators followed by authenticated user)
router.get('/following', protect, getFollowingFeed);

module.exports = router;
