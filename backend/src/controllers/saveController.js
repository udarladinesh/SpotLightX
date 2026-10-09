const mongoose = require('mongoose');
const Save = require('../models/Save');
const Video = require('../models/Video');
const { createNotification } = require('../services/notificationService');

/**
 * @desc    Save a video to bookmarks
 * @route   POST /api/videos/:id/save
 * @access  Private
 */
const saveVideo = async (req, res, next) => {
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

    // Do not allow saving private draft videos
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
        message: 'Draft videos cannot be saved. Publish the showcase first.'
      });
    }

    let isNewSave = false;
    try {
      await Save.create({
        user: req.user._id,
        video: id
      });
      isNewSave = true;
    } catch (err) {
      // 11000 duplicate key - already saved
      if (err.code !== 11000) {
        throw err;
      }
    }

    // Send notification to video creator if this is a new save and not self-action
    if (isNewSave && video.creator.toString() !== req.user._id.toString()) {
      const senderName = req.user.displayName || req.user.username || 'A user';
      createNotification({
        recipient: video.creator,
        sender: req.user._id,
        type: 'SAVE',
        message: `${senderName} saved your video "${video.title}"`,
        video: video._id
      }).catch((e) => console.warn('Failed to send save notification:', e.message));
    }

    return res.status(200).json({
      success: true,
      message: 'Video saved to your collection.',
      saved: true
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a video from saved bookmarks
 * @route   DELETE /api/videos/:id/save
 * @access  Private
 */
const unsaveVideo = async (req, res, next) => {
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

    await Save.findOneAndDelete({
      user: req.user._id,
      video: id
    });

    return res.status(200).json({
      success: true,
      message: 'Video removed from saved collection.',
      saved: false
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get save status for a video
 * @route   GET /api/videos/:id/save-status
 * @access  Private
 */
const getSaveStatus = async (req, res, next) => {
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

    const isSaved = await Save.exists({
      user: req.user._id,
      video: id
    });

    return res.status(200).json({
      success: true,
      saved: Boolean(isSaved)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's saved published videos
 * @route   GET /api/users/me/saved-videos or /api/users/saved-videos
 * @access  Private
 */
const getSavedVideos = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    // Fetch saves and populate video & video's creator
    const saves = await Save.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'video',
        match: { status: 'published' },
        populate: {
          path: 'creator',
          select: '_id displayName username profileImage bio location'
        }
      });

    // Filter out deleted or non-published videos
    const validSaves = saves.filter((save) => save.video !== null);
    const total = validSaves.length;
    const paginatedSaves = validSaves.slice(skip, skip + limit);
    const videos = paginatedSaves.map((save) => save.video);

    return res.status(200).json({
      success: true,
      count: videos.length,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      page,
      limit,
      videos
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveVideo,
  unsaveVideo,
  getSaveStatus,
  getSavedVideos
};
