const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Video = require('../models/Video');
const {
  createNotification,
  deleteNotificationsForComment
} = require('../services/notificationService');

/**
 * @desc    Get comments for a video (Paginated, newest first)
 * @route   GET /api/videos/:videoId/comments
 * @access  Public (Published) / Owner (Draft)
 */
const getVideoComments = async (req, res, next) => {
  try {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video ID format.'
      });
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.'
      });
    }

    // Inaccessible draft videos must not expose comments
    if (video.status === 'draft') {
      const isOwner = req.user && video.creator.toString() === req.user._id.toString();
      if (!isOwner) {
        return res.status(404).json({
          success: false,
          message: 'Video not found.'
        });
      }
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [comments, totalComments] = await Promise.all([
      Comment.find({ video: videoId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', '_id displayName username profileImage'),
      Comment.countDocuments({ video: videoId })
    ]);

    const totalPages = Math.ceil(totalComments / limit) || 1;

    return res.status(200).json({
      success: true,
      count: comments.length,
      totalComments,
      totalPages,
      page,
      limit,
      comments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a comment to a video
 * @route   POST /api/videos/:videoId/comments
 * @access  Private
 */
const addComment = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video ID format.'
      });
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.'
      });
    }

    // Inaccessible draft videos must not receive comments
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
        message: 'Comments cannot be added to unpublished draft videos.'
      });
    }

    // Validate comment text
    if (typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required.'
      });
    }

    const trimmedText = text.trim();

    if (trimmedText.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot be empty.'
      });
    }

    if (trimmedText.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot exceed 500 characters.'
      });
    }

    const comment = await Comment.create({
      user: req.user._id,
      video: videoId,
      text: trimmedText
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      'user',
      '_id displayName username profileImage'
    );

    // Send notification to video creator if not self-comment
    if (video.creator.toString() !== req.user._id.toString()) {
      const senderName = req.user.displayName || req.user.username || 'A user';
      await createNotification({
        recipient: video.creator,
        sender: req.user._id,
        type: 'COMMENT',
        message: `${senderName} commented on your video "${video.title}"`,
        video: video._id,
        comment: comment._id
      }).catch((e) => console.warn('Failed to send comment notification:', e.message));
    }

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully.',
      comment: populatedComment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a comment (Owner only)
 * @route   DELETE /api/videos/:videoId/comments/:commentId
 * @access  Private
 */
const deleteComment = async (req, res, next) => {
  try {
    const { videoId, commentId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(videoId) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format.'
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.'
      });
    }

    if (comment.video.toString() !== videoId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Comment does not belong to the specified video.'
      });
    }

    // Strict Authorization: Only comment creator (or admin) can delete
    const isOwner = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to delete this comment.'
      });
    }

    await Comment.findByIdAndDelete(commentId);

    // Clean up any notifications associated with this deleted comment
    deleteNotificationsForComment(commentId).catch((e) =>
      console.warn('Failed to delete notifications for comment:', e.message)
    );

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVideoComments,
  addComment,
  deleteComment
};

