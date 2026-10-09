const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getOverviewHandler,
  getVideoAnalyticsHandler,
  getTopVideosHandler,
  getFollowerAnalyticsHandler,
  getRecentActivityHandler
} = require('../controllers/analyticsController');

// All analytics routes strictly require authentication
router.use(protect);

/**
 * @route   GET /api/analytics/overview
 * @desc    Creator high-level metric overview
 */
router.get('/overview', getOverviewHandler);

/**
 * @route   GET /api/analytics/videos
 * @desc    Paginated published video metrics for creator
 */
router.get('/videos', getVideoAnalyticsHandler);

/**
 * @route   GET /api/analytics/top-videos
 * @desc    Top 5 performing published videos by engagement score
 */
router.get('/top-videos', getTopVideosHandler);

/**
 * @route   GET /api/analytics/followers
 * @desc    Follower stats and growth history across periods (7d, 30d, 90d, all)
 */
router.get('/followers', getFollowerAnalyticsHandler);

/**
 * @route   GET /api/analytics/activity
 * @desc    Recent interaction activity stream for creator
 */
router.get('/activity', getRecentActivityHandler);

module.exports = router;
