const mongoose = require('mongoose');
const Video = require('../models/Video');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Save = require('../models/Save');

/**
 * Helper to batch enrich video documents with social stats (likeCount, commentCount, isLiked, isSaved)
 * @param {Array} videos - Video documents or plain objects
 * @param {ObjectId|string|null} requesterId - Authenticated user ID if present
 */
async function enrichVideosWithSocial(videos, requesterId = null) {
  if (!videos || videos.length === 0) return [];
  const videoIds = videos.map((v) => v._id);

  const [likeAgg, commentAgg, userLikes, userSaves] = await Promise.all([
    Like.aggregate([
      { $match: { video: { $in: videoIds } } },
      { $group: { _id: '$video', count: { $sum: 1 } } }
    ]),
    Comment.aggregate([
      { $match: { video: { $in: videoIds } } },
      { $group: { _id: '$video', count: { $sum: 1 } } }
    ]),
    requesterId ? Like.find({ user: requesterId, video: { $in: videoIds } }).select('video') : [],
    requesterId ? Save.find({ user: requesterId, video: { $in: videoIds } }).select('video') : []
  ]);

  const likeMap = new Map(likeAgg.map((item) => [item._id.toString(), item.count]));
  const commentMap = new Map(commentAgg.map((item) => [item._id.toString(), item.count]));
  const likedSet = new Set(userLikes.map((item) => item.video.toString()));
  const savedSet = new Set(userSaves.map((item) => item.video.toString()));

  return videos.map((v) => {
    const vObj = v.toObject ? v.toObject() : { ...v };
    const idStr = v._id.toString();
    return {
      ...vObj,
      likeCount: vObj.likeCount !== undefined ? vObj.likeCount : (likeMap.get(idStr) || 0),
      commentCount: vObj.commentCount !== undefined ? vObj.commentCount : (commentMap.get(idStr) || 0),
      isLiked: likedSet.has(idStr),
      isSaved: savedSet.has(idStr)
    };
  });
}

/**
 * Fetch Fresh published videos sorted by newest createdAt first
 */
async function getFreshVideos({ page = 1, limit = 12, category = null, requesterId = null }) {
  const filter = { status: 'published' };
  if (category) {
    filter.category = category;
  }

  const skip = (page - 1) * limit;

  const [rawVideos, total] = await Promise.all([
    Video.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', '_id displayName username profileImage bio location'),
    Video.countDocuments(filter)
  ]);

  const videos = await enrichVideosWithSocial(rawVideos, requesterId);

  return {
    videos,
    total,
    page,
    limit
  };
}

/**
 * Fetch Trending published videos using transparent rule-based engagement formula with recency decay:
 *
 *   Raw Engagement = (views * 1) + (likes * 3) + (comments * 5)
 *   Age in Hours   = max(0, (now - createdAt) / 3600000)
 *   Trending Score = Raw Engagement / (1 + (Age in Hours / 24))
 *
 * Deterministic Sorting:
 *   1. trendingScore descending
 *   2. createdAt descending (tie-breaker)
 */
async function getTrendingVideos({ page = 1, limit = 12, category = null, requesterId = null }) {
  const matchStage = { status: 'published' };
  if (category) {
    matchStage.category = category;
  }

  const skip = (page - 1) * limit;
  const now = new Date();

  const pipeline = [
    { $match: matchStage },
    // Efficiently lookup like count
    {
      $lookup: {
        from: 'likes',
        let: { videoId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$video', '$$videoId'] } } },
          { $count: 'count' }
        ],
        as: 'likesData'
      }
    },
    // Efficiently lookup comment count
    {
      $lookup: {
        from: 'comments',
        let: { videoId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$video', '$$videoId'] } } },
          { $count: 'count' }
        ],
        as: 'commentsData'
      }
    },
    // Populate creator safe profile
    {
      $lookup: {
        from: 'users',
        localField: 'creator',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              _id: 1,
              displayName: 1,
              username: 1,
              profileImage: 1,
              bio: 1,
              location: 1
            }
          }
        ],
        as: 'creator'
      }
    },
    {
      $unwind: '$creator'
    },
    // Add engagement and age fields
    {
      $addFields: {
        likeCount: { $ifNull: [{ $arrayElemAt: ['$likesData.count', 0] }, 0] },
        commentCount: { $ifNull: [{ $arrayElemAt: ['$commentsData.count', 0] }, 0] },
        viewsCount: { $ifNull: ['$views', 0] },
        ageInHours: {
          $max: [
            0,
            {
              $divide: [
                { $subtract: [now, '$createdAt'] },
                3600000
              ]
            }
          ]
        }
      }
    },
    // Calculate rule-based trending score
    {
      $addFields: {
        trendingScore: {
          $divide: [
            {
              $add: [
                '$viewsCount',
                { $multiply: ['$likeCount', 3] },
                { $multiply: ['$commentCount', 5] }
              ]
            },
            {
              $add: [
                1,
                { $divide: ['$ageInHours', 24] }
              ]
            }
          ]
        }
      }
    },
    // Strip intermediate calculation fields
    {
      $project: {
        likesData: 0,
        commentsData: 0,
        ageInHours: 0,
        viewsCount: 0
      }
    },
    // Deterministic sorting
    {
      $sort: {
        trendingScore: -1,
        createdAt: -1
      }
    },
    // Facet for single-query pagination and total count
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skip }, { $limit: limit }]
      }
    }
  ];

  const result = await Video.aggregate(pipeline);
  const total = result[0]?.metadata[0]?.total || 0;
  const rawVideos = result[0]?.data || [];

  const videos = await enrichVideosWithSocial(rawVideos, requesterId);

  return {
    videos,
    total,
    page,
    limit
  };
}

/**
 * Fetch published videos created by creators followed by the authenticated user
 */
async function getFollowingVideos({ page = 1, limit = 12, category = null, requesterId }) {
  if (!requesterId) {
    throw new Error('Authentication required for following feed');
  }

  // 1. Fetch creators followed by requester
  const follows = await Follow.find({ follower: requesterId }).select('following');
  const followingIds = follows.map((f) => f.following);

  if (followingIds.length === 0) {
    return {
      videos: [],
      total: 0,
      page,
      limit
    };
  }

  // 2. Fetch published videos only from followed creators
  const filter = {
    creator: { $in: followingIds },
    status: 'published'
  };

  if (category) {
    filter.category = category;
  }

  const skip = (page - 1) * limit;

  const [rawVideos, total] = await Promise.all([
    Video.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', '_id displayName username profileImage bio location'),
    Video.countDocuments(filter)
  ]);

  const videos = await enrichVideosWithSocial(rawVideos, requesterId);

  return {
    videos,
    total,
    page,
    limit
  };
}

module.exports = {
  enrichVideosWithSocial,
  getFreshVideos,
  getTrendingVideos,
  getFollowingVideos
};
