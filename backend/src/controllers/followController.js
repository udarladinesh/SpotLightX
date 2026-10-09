const mongoose = require('mongoose');
const Follow = require('../models/Follow');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

/**
 * Helper to resolve user ID from parameter (supports ObjectId or username)
 */
async function resolveTargetUser(userParam) {
  if (!userParam) return null;

  if (mongoose.Types.ObjectId.isValid(userParam)) {
    const userById = await User.findById(userParam);
    if (userById) return userById;
  }

  // Fallback: search by username
  return await User.findOne({ username: userParam.trim().toLowerCase() });
}

/**
 * @desc    Follow a creator/user
 * @route   POST /api/users/:userId/follow
 * @access  Private
 */
const followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const targetUser = await resolveTargetUser(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found.'
      });
    }

    // Prevent users from following themselves
    if (req.user._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself.'
      });
    }

    let isNewFollow = false;
    try {
      await Follow.create({
        follower: req.user._id,
        following: targetUser._id
      });
      isNewFollow = true;
    } catch (err) {
      // 11000 duplicate key - already following
      if (err.code !== 11000) {
        throw err;
      }
    }

    // Send notification to followed creator if this is a new follow
    if (isNewFollow && targetUser._id.toString() !== req.user._id.toString()) {
      const senderName = req.user.displayName || req.user.username || 'A user';
      createNotification({
        recipient: targetUser._id,
        sender: req.user._id,
        type: 'FOLLOW',
        message: `${senderName} started following you.`
      }).catch((e) => console.warn('Failed to send follow notification:', e.message));
    }

    const followerCount = await Follow.countDocuments({ following: targetUser._id });

    return res.status(200).json({
      success: true,
      message: `You are now following @${targetUser.username}`,
      following: true,
      followerCount
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unfollow a creator/user
 * @route   DELETE /api/users/:userId/follow
 * @access  Private
 */
const unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const targetUser = await resolveTargetUser(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found.'
      });
    }

    await Follow.findOneAndDelete({
      follower: req.user._id,
      following: targetUser._id
    });

    const followerCount = await Follow.countDocuments({ following: targetUser._id });

    return res.status(200).json({
      success: true,
      message: `Unfollowed @${targetUser.username}`,
      following: false,
      followerCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get follow status of a user relative to the authenticated requester
 * @route   GET /api/users/:userId/follow-status
 * @access  Private
 */
const getFollowStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const targetUser = await resolveTargetUser(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found.'
      });
    }

    const isFollowing = await Follow.exists({
      follower: req.user._id,
      following: targetUser._id
    });

    return res.status(200).json({
      success: true,
      following: Boolean(isFollowing)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get followers of a user (Paginated, public)
 * @route   GET /api/users/:userId/followers
 * @access  Public
 */
const getUserFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const targetUser = await resolveTargetUser(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found.'
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      Follow.find({ following: targetUser._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('follower', '_id displayName username profileImage bio location skills categories'),
      Follow.countDocuments({ following: targetUser._id })
    ]);

    const followers = follows.map((f) => f.follower).filter(Boolean);

    return res.status(200).json({
      success: true,
      count: followers.length,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      page,
      limit,
      followers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get users followed by a user (Paginated, public)
 * @route   GET /api/users/:userId/following
 * @access  Public
 */
const getUserFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const targetUser = await resolveTargetUser(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found.'
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      Follow.find({ follower: targetUser._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('following', '_id displayName username profileImage bio location skills categories'),
      Follow.countDocuments({ follower: targetUser._id })
    ]);

    const following = follows.map((f) => f.following).filter(Boolean);

    return res.status(200).json({
      success: true,
      count: following.length,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      page,
      limit,
      following
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get follower and following counts for a creator
 * @route   GET /api/users/:userId/social-stats
 * @access  Public
 */
const getUserSocialStats = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const targetUser = await resolveTargetUser(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found.'
      });
    }

    const [followerCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: targetUser._id }),
      Follow.countDocuments({ follower: targetUser._id })
    ]);

    return res.status(200).json({
      success: true,
      followerCount,
      followingCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowStatus,
  getUserFollowers,
  getUserFollowing,
  getUserSocialStats
};
