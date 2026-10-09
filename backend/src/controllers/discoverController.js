const User = require('../models/User');
const {
  getFreshVideos,
  getTrendingVideos,
  getFollowingVideos
} = require('../services/discoverService');

/**
 * Helper to sanitize and validate pagination and category query parameters
 */
function parseDiscoveryParams(query) {
  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = 12;
  } else if (limit > 50) {
    limit = 50; // Max limit cap
  }

  let category = null;
  if (query.category && typeof query.category === 'string') {
    const trimmed = query.category.trim();
    if (trimmed.length > 0) {
      if (!User.ALLOWED_CATEGORIES.includes(trimmed)) {
        const err = new Error(
          `Invalid category '${trimmed}'. Allowed categories: ${User.ALLOWED_CATEGORIES.join(', ')}`
        );
        err.statusCode = 400;
        throw err;
      }
      category = trimmed;
    }
  }

  return { page, limit, category };
}

/**
 * Helper to structure standardized discovery API response
 */
function sendDiscoveryResponse(res, { videos, total, page, limit }) {
  const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);
  const hasNextPage = page * limit < total;

  return res.status(200).json({
    success: true,
    count: videos.length,
    total,
    totalPages,
    page,
    limit,
    hasNextPage,
    videos,
    pagination: {
      page,
      limit,
      totalVideos: total,
      totalPages,
      hasNextPage
    }
  });
}

/**
 * @desc    Get fresh published videos (newest first)
 * @route   GET /api/discover/fresh
 * @access  Public (Guests allowed, optional auth for social flags)
 */
const getFreshFeed = async (req, res, next) => {
  try {
    const { page, limit, category } = parseDiscoveryParams(req.query);
    const requesterId = req.user ? req.user._id : null;

    const result = await getFreshVideos({
      page,
      limit,
      category,
      requesterId
    });

    return sendDiscoveryResponse(res, result);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * @desc    Get trending published videos based on rule-based engagement score with recency decay
 * @route   GET /api/discover/trending
 * @access  Public (Guests allowed, optional auth for social flags)
 */
const getTrendingFeed = async (req, res, next) => {
  try {
    const { page, limit, category } = parseDiscoveryParams(req.query);
    const requesterId = req.user ? req.user._id : null;

    const result = await getTrendingVideos({
      page,
      limit,
      category,
      requesterId
    });

    return sendDiscoveryResponse(res, result);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * @desc    Get published videos created by accounts followed by authenticated user
 * @route   GET /api/discover/following
 * @access  Private (Authenticated users only)
 */
const getFollowingFeed = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please log in to view your following feed.'
      });
    }

    const { page, limit, category } = parseDiscoveryParams(req.query);

    const result = await getFollowingVideos({
      page,
      limit,
      category,
      requesterId: req.user._id
    });

    return sendDiscoveryResponse(res, result);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  getFreshFeed,
  getTrendingFeed,
  getFollowingFeed
};
