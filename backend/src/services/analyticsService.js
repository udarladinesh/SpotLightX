const mongoose = require('mongoose');
const Video = require('../models/Video');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Save = require('../models/Save');
const Follow = require('../models/Follow');
const Notification = require('../models/Notification');

/**
 * Top Video Engagement Formula Documentation:
 * Raw Engagement Score = views + (likes * 3) + (comments * 5) + (saves * 4)
 * Note: This is a purely rule-based / statistical metric, NOT an AI recommendation system.
 */
const ENGAGEMENT_FORMULA_DOC = 'views + (likes * 3) + (comments * 5) + (saves * 4)';

/**
 * Valid periods for follower growth analytics
 */
const ALLOWED_PERIODS = ['7d', '30d', '90d', 'all'];

/**
 * Helper to safely calculate engagement rate
 * Formula: (Total Interactions / Views) * 100
 * Ensures rate is strictly 0 if views is 0 and never returns NaN or Infinity.
 */
function calculateEngagementRate(interactions, views) {
  if (!views || views <= 0) return 0;
  const rate = (interactions / views) * 100;
  if (isNaN(rate) || !isFinite(rate)) return 0;
  return Number(rate.toFixed(2));
}

/**
 * 1. GET /api/analytics/overview
 * Returns creator high-level summary metrics across their published videos and followers.
 * Uses req.user._id exclusively. Excludes drafts.
 * @param {ObjectId|string} userId
 */
async function getOverview(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 1. Aggregate published videos and view counts for this creator in a single trip
  const videoStats = await Video.aggregate([
    { $match: { creator: userObjectId, status: 'published' } },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: '$views' },
        videoIds: { $push: '$_id' }
      }
    }
  ]);

  const totalVideos = videoStats[0]?.totalVideos || 0;
  const totalViews = videoStats[0]?.totalViews || 0;
  const videoIds = videoStats[0]?.videoIds || [];

  // 2. Efficiently count social interactions across published videos & follower stats in parallel
  const [totalLikes, totalComments, totalSaves, totalFollowers, totalFollowing] = await Promise.all([
    videoIds.length > 0 ? Like.countDocuments({ video: { $in: videoIds } }) : 0,
    videoIds.length > 0 ? Comment.countDocuments({ video: { $in: videoIds } }) : 0,
    videoIds.length > 0 ? Save.countDocuments({ video: { $in: videoIds } }) : 0,
    Follow.countDocuments({ following: userObjectId }),
    Follow.countDocuments({ follower: userObjectId })
  ]);

  const totalInteractions = totalLikes + totalComments + totalSaves;
  const engagementRate = calculateEngagementRate(totalInteractions, totalViews);

  return {
    totalVideos,
    totalViews,
    totalLikes,
    totalComments,
    totalSaves,
    totalFollowers,
    totalFollowing,
    totalInteractions,
    engagementRate,
    overview: {
      totalVideos,
      totalViews,
      totalLikes,
      totalComments,
      totalSaves,
      totalFollowers,
      totalFollowing,
      totalInteractions,
      engagementRate
    }
  };
}

/**
 * 2. GET /api/analytics/videos
 * Returns paginated list of creator's published videos with detailed metrics.
 * Default page = 1, default limit = 10, max limit = 50.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {number} params.page
 * @param {number} params.limit
 */
async function getVideoAnalytics({ userId, page = 1, limit = 10 }) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (safePage - 1) * safeLimit;

  const query = { creator: userId, status: 'published' };

  // Fetch paginated videos and total published count
  const [videos, total] = await Promise.all([
    Video.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .select('_id title description thumbnailUrl category duration views status createdAt')
      .lean(),
    Video.countDocuments(query)
  ]);

  const videoIds = videos.map((v) => v._id);

  // Grouped counts for likes, comments, and saves for this page (O(1) database trips, no N+1)
  const [likeCounts, commentCounts, saveCounts] = videoIds.length > 0
    ? await Promise.all([
        Like.aggregate([
          { $match: { video: { $in: videoIds } } },
          { $group: { _id: '$video', count: { $sum: 1 } } }
        ]),
        Comment.aggregate([
          { $match: { video: { $in: videoIds } } },
          { $group: { _id: '$video', count: { $sum: 1 } } }
        ]),
        Save.aggregate([
          { $match: { video: { $in: videoIds } } },
          { $group: { _id: '$video', count: { $sum: 1 } } }
        ])
      ])
    : [[], [], []];

  const likeMap = new Map(likeCounts.map((item) => [item._id.toString(), item.count]));
  const commentMap = new Map(commentCounts.map((item) => [item._id.toString(), item.count]));
  const saveMap = new Map(saveCounts.map((item) => [item._id.toString(), item.count]));

  const formattedVideos = videos.map((v) => {
    const vId = v._id.toString();
    const views = v.views || 0;
    const likes = likeMap.get(vId) || 0;
    const comments = commentMap.get(vId) || 0;
    const saves = saveMap.get(vId) || 0;
    const interactions = likes + comments + saves;
    const engagementRate = calculateEngagementRate(interactions, views);
    const engagementScore = views + (likes * 3) + (comments * 5) + (saves * 4);

    return {
      id: v._id,
      _id: v._id,
      title: v.title,
      thumbnailUrl: v.thumbnailUrl || '',
      category: v.category,
      duration: v.duration || 0,
      views,
      likes,
      comments,
      saves,
      interactions,
      engagementRate,
      engagementScore,
      createdAt: v.createdAt
    };
  });

  const totalPages = Math.ceil(total / safeLimit) || (total === 0 ? 0 : 1);
  const hasNextPage = safePage * safeLimit < total;

  return {
    videos: formattedVideos,
    total,
    totalPages,
    page: safePage,
    limit: safeLimit,
    hasNextPage,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage
    }
  };
}

/**
 * 3. GET /api/analytics/top-videos
 * Returns creator's top 5 published videos by raw engagement score:
 * Raw Engagement = views + (likes * 3) + (comments * 5) + (saves * 4)
 * @param {ObjectId|string} userId
 */
async function getTopVideos(userId) {
  const query = { creator: userId, status: 'published' };

  const videos = await Video.find(query)
    .select('_id title thumbnailUrl category duration views createdAt')
    .lean();

  if (!videos || videos.length === 0) {
    return {
      topVideos: [],
      count: 0,
      formula: ENGAGEMENT_FORMULA_DOC
    };
  }

  const videoIds = videos.map((v) => v._id);

  // Grouped aggregation for likes, comments, and saves
  const [likeCounts, commentCounts, saveCounts] = await Promise.all([
    Like.aggregate([
      { $match: { video: { $in: videoIds } } },
      { $group: { _id: '$video', count: { $sum: 1 } } }
    ]),
    Comment.aggregate([
      { $match: { video: { $in: videoIds } } },
      { $group: { _id: '$video', count: { $sum: 1 } } }
    ]),
    Save.aggregate([
      { $match: { video: { $in: videoIds } } },
      { $group: { _id: '$video', count: { $sum: 1 } } }
    ])
  ]);

  const likeMap = new Map(likeCounts.map((item) => [item._id.toString(), item.count]));
  const commentMap = new Map(commentCounts.map((item) => [item._id.toString(), item.count]));
  const saveMap = new Map(saveCounts.map((item) => [item._id.toString(), item.count]));

  const scoredVideos = videos.map((v) => {
    const vId = v._id.toString();
    const views = v.views || 0;
    const likes = likeMap.get(vId) || 0;
    const comments = commentMap.get(vId) || 0;
    const saves = saveMap.get(vId) || 0;
    const interactions = likes + comments + saves;
    const engagementScore = views + (likes * 3) + (comments * 5) + (saves * 4);
    const engagementRate = calculateEngagementRate(interactions, views);

    return {
      video: {
        id: v._id,
        _id: v._id,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl || '',
        category: v.category,
        duration: v.duration || 0,
        createdAt: v.createdAt
      },
      views,
      likes,
      comments,
      saves,
      engagementScore,
      engagementRate
    };
  });

  // Sort descending by engagementScore, then views, then recency
  scoredVideos.sort((a, b) => {
    if (b.engagementScore !== a.engagementScore) {
      return b.engagementScore - a.engagementScore;
    }
    if (b.views !== a.views) {
      return b.views - a.views;
    }
    return new Date(b.video.createdAt) - new Date(a.video.createdAt);
  });

  const topVideos = scoredVideos.slice(0, 5);

  return {
    topVideos,
    count: topVideos.length,
    formula: ENGAGEMENT_FORMULA_DOC
  };
}

/**
 * 4. GET /api/analytics/followers
 * Returns follower metrics and historical growth for period (7d, 30d, 90d, all).
 * Safe fallback for unrecognized periods.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {string} params.period
 */
async function getFollowerAnalytics({ userId, period = '30d' }) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const normalizedPeriod = typeof period === 'string' ? period.toLowerCase().trim() : '30d';
  const validPeriod = ALLOWED_PERIODS.includes(normalizedPeriod) ? normalizedPeriod : '30d';

  let startDate;
  const now = new Date();

  switch (validPeriod) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      startDate = new Date(0);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const [currentFollowers, currentFollowing, newFollowers, growthHistory] = await Promise.all([
    Follow.countDocuments({ following: userObjectId }),
    Follow.countDocuments({ follower: userObjectId }),
    Follow.countDocuments({ following: userObjectId, createdAt: { $gte: startDate } }),
    Follow.aggregate([
      {
        $match: {
          following: userObjectId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  const history = growthHistory.map((item) => ({
    date: item._id,
    newFollowers: item.count
  }));

  return {
    currentFollowers,
    currentFollowing,
    newFollowers,
    period: validPeriod,
    startDate,
    growthHistory: history
  };
}

/**
 * 5. GET /api/analytics/activity
 * Returns recent 10-20 creator activity events (follows, likes, comments, saves)
 * Reuses the Phase 7 Notification model and strictly verifies ownership.
 * Excludes sensitive fields (passwords, emails).
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {number} params.limit
 */
async function getRecentActivity({ userId, limit = 15 }) {
  const safeLimit = Math.min(20, Math.max(1, parseInt(limit, 10) || 15));

  const activities = await Notification.find({
    recipient: userId,
    type: { $in: ['FOLLOW', 'LIKE', 'COMMENT', 'SAVE'] }
  })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .populate('sender', '_id displayName username profileImage')
    .populate('video', '_id title thumbnailUrl category')
    .populate('comment', '_id text')
    .lean();

  const formattedActivities = activities.map((act) => ({
    id: act._id,
    _id: act._id,
    type: act.type,
    message: act.message,
    sender: act.sender
      ? {
          id: act.sender._id,
          _id: act.sender._id,
          displayName: act.sender.displayName,
          username: act.sender.username,
          profileImage: act.sender.profileImage || ''
        }
      : null,
    video: act.video
      ? {
          id: act.video._id,
          _id: act.video._id,
          title: act.video.title,
          thumbnailUrl: act.video.thumbnailUrl || '',
          category: act.video.category
        }
      : null,
    comment: act.comment
      ? {
          id: act.comment._id,
          _id: act.comment._id,
          text: act.comment.text
        }
      : null,
    createdAt: act.createdAt
  }));

  return {
    activities: formattedActivities,
    count: formattedActivities.length
  };
}

module.exports = {
  getOverview,
  getVideoAnalytics,
  getTopVideos,
  getFollowerAnalytics,
  getRecentActivity,
  calculateEngagementRate,
  ENGAGEMENT_FORMULA_DOC,
  ALLOWED_PERIODS
};
