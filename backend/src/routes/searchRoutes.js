const express = require('express');
const router = express.Router();
const {
  searchVideosHandler,
  searchCreatorsHandler
} = require('../controllers/searchController');
const { optionalAuth } = require('../middleware/authMiddleware');

// ---------------------- Search & Talent Discovery Routes ----------------------

// Public / Semi-Personalized: Search published videos by text, category, and skill
router.get('/videos', optionalAuth, searchVideosHandler);

// Public / Semi-Personalized: Search creators by text, category, and skill
router.get('/creators', optionalAuth, searchCreatorsHandler);

module.exports = router;
