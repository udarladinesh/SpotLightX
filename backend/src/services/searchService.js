const mongoose = require('mongoose');
const Video = require('../models/Video');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Save = require('../models/Save');

/**
 * Escape special regex characters to prevent uncontrolled query injection or ReDoS attacks
 * @param {string} text
 * @returns {string}
 */
function escapeRegex(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


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
 * Helper to batch enrich creator user documents with social and showcase stats
 * @param {Array} users - User documents or plain objects
 * @param {ObjectId|string|null} requesterId - Authenticated user ID if present
 */
async function enrichCreatorsWithStats(users, requesterId = null) {
  if (!users || users.length === 0) return [];
  const userIds = users.map((u) => u._id);

  const [followerAgg, followingAgg, videoAgg, userFollows] = await Promise.all([
    Follow.aggregate([
      { $match: { following: { $in: userIds } } },
      { $group: { _id: '$following', count: { $sum: 1 } } }
    ]),
    Follow.aggregate([
      { $match: { follower: { $in: userIds } } },
      { $group: { _id: '$follower', count: { $sum: 1 } } }
    ]),
    Video.aggregate([
      { $match: { creator: { $in: userIds }, status: 'published' } },
      { $group: { _id: '$creator', count: { $sum: 1 } } }
    ]),
    requesterId ? Follow.find({ follower: requesterId, following: { $in: userIds } }).select('following') : []
  ]);

  const followerMap = new Map(followerAgg.map((item) => [item._id.toString(), item.count]));
  const followingMap = new Map(followingAgg.map((item) => [item._id.toString(), item.count]));
  const videoMap = new Map(videoAgg.map((item) => [item._id.toString(), item.count]));
  const followingSet = new Set(userFollows.map((item) => item.following.toString()));

  return users.map((u) => {
    const uObj = u.toObject ? u.toObject() : { ...u };
    const idStr = u._id.toString();

    // Strict privacy strip
    delete uObj.password;
    delete uObj.email;
    delete uObj.__v;

    return {
      _id: uObj._id,
      displayName: uObj.displayName,
      username: uObj.username,
      profileImage: uObj.profileImage || '',
      bio: uObj.bio || '',
      skills: uObj.skills || [],
      categories: uObj.categories || [],
      location: uObj.location || '',
      socialLinks: uObj.socialLinks || {},
      createdAt: uObj.createdAt,
      followerCount: followerMap.get(idStr) || 0,
      followingCount: followingMap.get(idStr) || 0,
      videoCount: videoMap.get(idStr) || 0,
      isFollowing: followingSet.has(idStr)
    };
  });
}

/**
 * Search published videos matching query text, category, and/or skill
 * @param {Object} options
 * @param {string|null} options.q - Free-text search string
 * @param {string|null} options.category - Talent category filter
 * @param {string|null} options.skill - Skill filter
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Limit per page (default: 12, max: 50)
 * @param {ObjectId|string|null} options.requesterId - Authenticated user ID for social flags
 */
async function searchVideos({ q = null, category = null, skill = null, page = 1, limit = 12, requesterId = null }) {
  const conditions = [{ status: 'published' }];

  if (category) {
    conditions.push({ category: category });
  }

  if (skill) {
    const escapedSkill = escapeRegex(skill);
    conditions.push({
      skills: { $regex: new RegExp(escapedSkill, 'i') }
    });
  }

  if (q) {
    const escapedQ = escapeRegex(q);
    const searchRegex = new RegExp(escapedQ, 'i');
    conditions.push({
      $or: [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { skills: { $regex: searchRegex } }
      ]
    });
  }

  const queryFilter = conditions.length === 1 ? conditions[0] : { $and: conditions };
  const skip = (page - 1) * limit;

  const [rawVideos, total] = await Promise.all([
    Video.find(queryFilter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', '_id displayName username profileImage bio location'),
    Video.countDocuments(queryFilter)
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
 * Search creator profiles matching query text, category, and/or skill
 * @param {Object} options
 * @param {string|null} options.q - Free-text search string (username, displayName, bio, location, skills)
 * @param {string|null} options.category - Category filter
 * @param {string|null} options.skill - Skill filter
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Limit per page (default: 12, max: 50)
 * @param {ObjectId|string|null} options.requesterId - Authenticated user ID for isFollowing flag
 */
async function searchCreators({ q = null, category = null, skill = null, page = 1, limit = 12, requesterId = null }) {
  const conditions = [];

  if (category) {
    conditions.push({ categories: category });
  }

  if (skill) {
    const escapedSkill = escapeRegex(skill);
    conditions.push({
      skills: { $regex: new RegExp(escapedSkill, 'i') }
    });
  }

  if (q) {
    const escapedQ = escapeRegex(q);
    const searchRegex = new RegExp(escapedQ, 'i');
    conditions.push({
      $or: [
        { displayName: { $regex: searchRegex } },
        { username: { $regex: searchRegex } },
        { bio: { $regex: searchRegex } },
        { location: { $regex: searchRegex } },
        { skills: { $regex: searchRegex } }
      ]
    });
  }

  const queryFilter = conditions.length === 0 ? {} : (conditions.length === 1 ? conditions[0] : { $and: conditions });
  const skip = (page - 1) * limit;

  const [rawUsers, total] = await Promise.all([
    User.find(queryFilter)
      .select('_id displayName username profileImage bio skills categories location socialLinks createdAt')
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(queryFilter)
  ]);

  const creators = await enrichCreatorsWithStats(rawUsers, requesterId);

  return {
    creators,
    total,
    page,
    limit
  };
}

module.exports = {
  escapeRegex,
  enrichVideosWithSocial,
  enrichCreatorsWithStats,
  searchVideos,
  searchCreators
};
