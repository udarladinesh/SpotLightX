const mongoose = require('mongoose');
const Like = require('../models/Like');
const Video = require('../models/Video');
const { createNotification } = require('../services/notificationService');

/**
 * @desc    Like a video
 * @route   POST /api/videos/:id/like
 * @access  Private
 */
const likeVideo = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video ID format.'
      });
    }

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.'
      });
    }

    // Disallow liking inaccessible draft videos
    if (video.status === 'draft') {
      const isOwner = req.user && video.creator.toString() === req.user._id.toString();
      if (!isOwner) {
        return res.status(404).json({
          success: false,
          message: 'Video not found.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Draft videos cannot receive likes. Publish this video first.'
      });
    }

    let isNewLike = false;
    // Create like or handle duplicate gracefully
    try {
      await Like.create({
        user: req.user._id,
        video: id
      });
      isNewLike = true;
    } catch (err) {
      // 11000 is MongoDB duplicate key error - already liked
      if (err.code !== 11000) {
        throw err;
      }
    }

    // Send notification to video creator if this is a new like and not self-action
    if (isNewLike && video.creator.toString() !== req.user._id.toString()) {
      const senderName = req.user.displayName || req.user.username || 'A user';
      createNotification({
        recipient: video.creator,
        sender: req.user._id,
        type: 'LIKE',
        message: `${senderName} liked your video "${video.title}"`,
        video: video._id
      }).catch((e) => console.warn('Failed to send like notification:', e.message));
    }

    const likeCount = await Like.countDocuments({ video: id });

    return res.status(200).json({
      success: true,
      message: 'Video liked successfully.',
      liked: true,
      likeCount
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unlike a video
 * @route   DELETE /api/videos/:id/like
 * @access  Private
 */
const unlikeVideo = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video ID format.'
      });
    }

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.'
      });
    }

    // Remove user's like safely
    await Like.findOneAndDelete({
      user: req.user._id,
      video: id
    });

    const likeCount = await Like.countDocuments({ video: id });

    return res.status(200).json({
      success: true,
      message: 'Video unliked successfully.',
      liked: false,
      likeCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get like status and count for a video
 * @route   GET /api/videos/:id/like-status
 * @access  Private
 */
const getLikeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video ID format.'
      });
    }

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.'
      });
    }

    // Draft privacy check
    if (video.status === 'draft') {
      const isOwner = req.user && video.creator.toString() === req.user._id.toString();
      if (!isOwner) {
        return res.status(404).json({
          success: false,
          message: 'Video not found.'
        });
      }
    }

    const isLiked = await Like.exists({
      user: req.user._id,
      video: id
    });

    const likeCount = await Like.countDocuments({ video: id });

    return res.status(200).json({
      success: true,
      liked: Boolean(isLiked),
      likeCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  likeVideo,
  unlikeVideo,
  getLikeStatus
};
