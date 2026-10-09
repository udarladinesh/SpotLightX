const {
  getOverview,
  getVideoAnalytics,
  getTopVideos,
  getFollowerAnalytics,
  getRecentActivity
} = require('../services/analyticsService');

/**
 * @desc    Get high-level creator analytics overview
 * @route   GET /api/analytics/overview
 * @access  Private (Authenticated Creator only)
 */
const getOverviewHandler = async (req, res, next) => {
  try {
    // Strictly retrieve user ID from verified JWT session - never trust frontend param
    const data = await getOverview(req.user._id);

    return res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated video performance metrics for creator's published showcases
 * @route   GET /api/analytics/videos
 * @access  Private (Authenticated Creator only)
 */
const getVideoAnalyticsHandler = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const data = await getVideoAnalytics({
      userId: req.user._id,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get creator's top 5 performing published showcases
 * @route   GET /api/analytics/top-videos
 * @access  Private (Authenticated Creator only)
 */
const getTopVideosHandler = async (req, res, next) => {
  try {
    const data = await getTopVideos(req.user._id);

    return res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get follower growth metrics and period history (7d, 30d, 90d, all)
 * @route   GET /api/analytics/followers
 * @access  Private (Authenticated Creator only)
 */
const getFollowerAnalyticsHandler = async (req, res, next) => {
  try {
    const { period } = req.query;

    const data = await getFollowerAnalytics({
      userId: req.user._id,
      period
    });

    return res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recent creator interaction activities (follows, likes, comments, saves)
 * @route   GET /api/analytics/activity
 * @access  Private (Authenticated Creator only)
 */
const getRecentActivityHandler = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 15;

    const data = await getRecentActivity({
      userId: req.user._id,
      limit
    });

    return res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverviewHandler,
  getVideoAnalyticsHandler,
  getTopVideosHandler,
  getFollowerAnalyticsHandler,
  getRecentActivityHandler
};
