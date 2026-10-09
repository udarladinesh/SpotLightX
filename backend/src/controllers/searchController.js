const User = require('../models/User');
const { searchVideos, searchCreators } = require('../services/searchService');

/**
 * Helper to sanitize and validate search query parameters
 * @param {Object} query
 * @returns {{ q: string|null, category: string|null, skill: string|null, page: number, limit: number }}
 */
function parseSearchParams(query) {
  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = 12;
  } else if (limit > 50) {
    limit = 50; // Cap maximum limit at 50
  }

  let q = null;
  if (query.q && typeof query.q === 'string') {
    const trimmed = query.q.trim();
    if (trimmed.length > 0) {
      // Limit search query length to 100 chars to avoid expensive queries
      q = trimmed.slice(0, 100);
    }
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

  let skill = null;
  if (query.skill && typeof query.skill === 'string') {
    const trimmed = query.skill.trim();
    if (trimmed.length > 0) {
      skill = trimmed.slice(0, 50);
    }
  }

  return { q, category, skill, page, limit };
}

/**
 * @desc    Search published videos by title, description, skills, category
 * @route   GET /api/search/videos
 * @access  Public (Optional Auth for social flags)
 */
const searchVideosHandler = async (req, res, next) => {
  try {
    const { q, category, skill, page, limit } = parseSearchParams(req.query);
    const requesterId = req.user ? req.user._id : null;

    const result = await searchVideos({
      q,
      category,
      skill,
      page,
      limit,
      requesterId
    });

    const totalPages = Math.ceil(result.total / limit) || (result.total === 0 ? 0 : 1);
    const hasNextPage = page * limit < result.total;

    return res.status(200).json({
      success: true,
      count: result.videos.length,
      total: result.total,
      totalPages,
      page,
      limit,
      hasNextPage,
      videos: result.videos,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNextPage
      }
    });
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
 * @desc    Search creators by username, display name, bio, skills, location, categories
 * @route   GET /api/search/creators
 * @access  Public (Optional Auth for following flags)
 */
const searchCreatorsHandler = async (req, res, next) => {
  try {
    const { q, category, skill, page, limit } = parseSearchParams(req.query);
    const requesterId = req.user ? req.user._id : null;

    const result = await searchCreators({
      q,
      category,
      skill,
      page,
      limit,
      requesterId
    });

    const totalPages = Math.ceil(result.total / limit) || (result.total === 0 ? 0 : 1);
    const hasNextPage = page * limit < result.total;

    return res.status(200).json({
      success: true,
      count: result.creators.length,
      total: result.total,
      totalPages,
      page,
      limit,
      hasNextPage,
      creators: result.creators,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNextPage
      }
    });
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
  parseSearchParams,
  searchVideosHandler,
  searchCreatorsHandler
};
