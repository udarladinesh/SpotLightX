const fs = require('fs');
const mongoose = require('mongoose');
const Video = require('../models/Video');
const User = require('../models/User');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Save = require('../models/Save');
const {
  uploadVideo,
  uploadThumbnail,
  deleteVideoAsset,
  deleteThumbnailAsset,
  isCloudinaryConfigured
} = require('../services/storageService');
const {
  createNotification,
  deleteNotificationsForVideo
} = require('../services/notificationService');

/**
 * Helper to batch enrich video documents with social stats (likeCount, commentCount, isLiked, isSaved)
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
      likeCount: likeMap.get(idStr) || 0,
      commentCount: commentMap.get(idStr) || 0,
      isLiked: likedSet.has(idStr),
      isSaved: savedSet.has(idStr)
    };
  });
}

/**
 * In-memory view cooldown tracker: Map<"identifier_videoId", timestamp>
 * Prevents artificial view inflation on repeated refreshes and duplicate views.
 * Cooldown: 24 hours per unique user / IP per video.
 */
const viewCooldowns = new Map();
const VIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours cooldown per viewer per video

// Periodic cleanup of expired cooldown timestamps every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of viewCooldowns.entries()) {
    if (now - timestamp > VIEW_COOLDOWN_MS) {
      viewCooldowns.delete(key);
    }
  }
}, 15 * 60 * 1000);

/**
 * Check and record a view attempt with multi-layer duplicate protection:
 * 1. Creator self-views are never counted.
 * 2. Authenticated user ID cooldown prevents duplicate views across devices/IPs.
 * 3. Client IP cooldown prevents duplicate views from unauthenticated viewers.
 *
 * @param {string|null} userIdOrIp - Authenticated user ID (if logged in) or client IP
 * @param {string} ipOrVideoId - Client IP or videoId
 * @param {string} [videoIdArg] - Video ObjectId string
 * @param {boolean} [isCreator=false] - Whether the requester is the creator of the video
 * @returns {boolean} true if view should be counted, false if duplicate/throttled
 */
function shouldCountView(userIdOrIp, ipOrVideoId, videoIdArg, isCreator = false) {
  let userId = null;
  let ip = null;
  let videoId = null;

  // Handle both 2-arg legacy signature (ip, videoId) and 4-arg signature (userId, ip, videoId, isCreator)
  if (arguments.length <= 2) {
    ip = userIdOrIp;
    videoId = ipOrVideoId;
  } else {
    userId = userIdOrIp;
    ip = ipOrVideoId;
    videoId = videoIdArg;
  }

  if (!videoId) return false;

  // Rule 1: Creator viewing their own video should never inflate view counts
  if (isCreator) return false;

  const now = Date.now();
  let isDuplicate = false;

  // Check authenticated user key if user is logged in
  if (userId) {
    const userKey = `user_${userId}_${videoId}`;
    const lastUserView = viewCooldowns.get(userKey);
    if (lastUserView && now - lastUserView < VIEW_COOLDOWN_MS) {
      isDuplicate = true;
    }
  }

  // Check client IP key
  if (ip && ip !== 'unknown-ip') {
    const ipKey = `ip_${ip}_${videoId}`;
    const lastIpView = viewCooldowns.get(ipKey);
    if (lastIpView && now - lastIpView < VIEW_COOLDOWN_MS) {
      isDuplicate = true;
    }
  }

  if (isDuplicate) {
    return false;
  }

  // Record view timestamps for both keys to prevent duplicate counting
  if (userId) {
    viewCooldowns.set(`user_${userId}_${videoId}`, now);
  }
  if (ip && ip !== 'unknown-ip') {
    viewCooldowns.set(`ip_${ip}_${videoId}`, now);
  }

  return true;
}

/**
 * Helper to safely unlink temporary files from disk
 */
function cleanTempFile(filePath) {
  if (filePath && typeof filePath === 'string') {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn(`Failed to unlink temp file (${filePath}):`, e.message);
    }
  }
}

/**
 * Helper to parse skills from various input formats (array, JSON string, or comma-separated)
 */
function parseSkills(skillsInput) {
  if (!skillsInput) return [];
  if (Array.isArray(skillsInput)) {
    return skillsInput
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter((s) => s.length > 0 && s.length <= 30)
      .slice(0, 20);
  }
  if (typeof skillsInput === 'string') {
    try {
      const parsed = JSON.parse(skillsInput);
      if (Array.isArray(parsed)) {
        return parseSkills(parsed);
      }
    } catch (e) {
      return skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length <= 30)
        .slice(0, 20);
    }
  }
  return [];
}

/**
 * @desc    Upload a new video with metadata
 * @route   POST /api/videos
 * @access  Private (Authenticated Creator)
 */
const createVideo = async (req, res, next) => {
  let videoTempPath = null;
  let thumbTempPath = null;
  let videoUploadResult = null;
  let thumbUploadResult = null;

  try {
    const { title, description, category, skills, status } = req.body;

    // 1. Verify Cloudinary configuration
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          'Media storage is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to backend/.env.'
      });
    }

    // 2. Validate video file
    if (!req.files || !req.files.video || req.files.video.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a video file (MP4, WebM, MOV).'
      });
    }

    // 3. Validate Title
    if (!title || title.trim().length < 3 || title.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Video title is required and must be between 3 and 100 characters.'
      });
    }

    // 4. Validate Category
    if (!category || !User.ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Please select a valid talent category from: ${User.ALLOWED_CATEGORIES.join(', ')}`
      });
    }

    // 5. Parse Skills
    const parsedSkills = parseSkills(skills);

    // 6. Validate Description
    const trimmedDesc = description ? description.trim() : '';
    if (trimmedDesc.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 1000 characters.'
      });
    }

    const videoFile = req.files.video[0];
    videoTempPath = videoFile.path || null;
    const videoSource = videoFile.path || videoFile.buffer;

    // 7. Stream video to Cloudinary
    console.log(`🎬 Uploading video "${title.trim()}" (${(videoFile.size / 1024 / 1024).toFixed(2)} MB) to Cloudinary...`);
    videoUploadResult = await uploadVideo(videoSource, videoFile.originalname);

    let thumbnailUrl = videoUploadResult.thumbnailUrl || '';
    let thumbnailPublicId = '';

    // 8. Upload custom thumbnail if provided
    if (req.files.thumbnail && req.files.thumbnail.length > 0) {
      const thumbFile = req.files.thumbnail[0];
      thumbTempPath = thumbFile.path || null;
      const thumbSource = thumbFile.path || thumbFile.buffer;
      console.log(`🖼️ Uploading custom thumbnail for "${title.trim()}"...`);
      thumbUploadResult = await uploadThumbnail(thumbSource);
      thumbnailUrl = thumbUploadResult.thumbnailUrl;
      thumbnailPublicId = thumbUploadResult.thumbnailPublicId;
    }

    // 9. Save Video document with Rollback Protection if DB fails
    let newVideo;
    try {
      newVideo = await Video.create({
        title: title.trim(),
        description: trimmedDesc,
        videoUrl: videoUploadResult.videoUrl,
        thumbnailUrl,
        publicId: videoUploadResult.publicId,
        thumbnailPublicId,
        creator: req.user._id,
        category,
        skills: parsedSkills,
        duration: videoUploadResult.duration || 0,
        views: 0,
        status: status === 'draft' ? 'draft' : 'published'
      });
    } catch (dbError) {
      console.error('⚠️ MongoDB record creation failed after upload. Rolling back Cloudinary assets...');
      if (videoUploadResult && videoUploadResult.publicId) {
        await deleteVideoAsset(videoUploadResult.publicId);
      }
      if (thumbnailPublicId) {
        await deleteThumbnailAsset(thumbnailPublicId);
      }
      throw dbError;
    }

    const populatedVideo = await Video.findById(newVideo._id).populate(
      'creator',
      '_id displayName username profileImage bio location'
    );

    // Send notification to creator when showcase is published
    if (newVideo.status === 'published') {
      createNotification({
        recipient: req.user._id,
        sender: null,
        type: 'VIDEO_PUBLISHED',
        message: `Your showcase "${newVideo.title}" is now published on Spotly!`,
        video: newVideo._id
      }).catch((e) => console.warn('Failed to send video published notification:', e.message));
    }

    return res.status(201).json({
      success: true,
      message: 'Video uploaded successfully!',
      video: populatedVideo
    });
  } catch (error) {
    next(error);
  } finally {
    // Clean up temporary files on disk to free up resources
    cleanTempFile(videoTempPath);
    cleanTempFile(thumbTempPath);
  }
};

/**
 * @desc    Get all videos uploaded by the logged-in creator (including drafts)
 * @route   GET /api/videos/my
 * @access  Private
 */
const getMyVideos = async (req, res, next) => {
  try {
    const rawVideos = await Video.find({ creator: req.user._id })
      .sort({ createdAt: -1 })
      .populate('creator', '_id displayName username profileImage');

    const videos = await enrichVideosWithSocial(rawVideos, req.user._id);

    return res.status(200).json({
      success: true,
      count: videos.length,
      videos
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single video by ID (Enforces Draft Privacy & View Throttling)
 * @route   GET /api/videos/:id
 * @access  Public (Published) / Creator Only (Draft)
 */
const getVideoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video ID format.'
      });
    }

    const video = await Video.findById(id).populate(
      'creator',
      '_id displayName username profileImage bio location socialLinks createdAt'
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.'
      });
    }

    // Draft Privacy: If status is draft, only the creator who owns it can view it
    if (video.status === 'draft') {
      const isOwner =
        req.user &&
        video.creator &&
        req.user._id.toString() === video.creator._id.toString();

      if (!isOwner) {
        return res.status(404).json({
          success: false,
          message: 'Video not found.'
        });
      }
    }

    // View counting: If published and not a duplicate view within cooldown, increment views
    if (video.status === 'published') {
      const clientIp =
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.ip ||
        req.connection?.remoteAddress ||
        'unknown-ip';
      const userId = req.user ? req.user._id.toString() : null;
      const isCreator = Boolean(
        req.user &&
        video.creator &&
        req.user._id.toString() === (video.creator._id || video.creator).toString()
      );

      if (shouldCountView(userId, clientIp, video._id.toString(), isCreator)) {
        await Video.findByIdAndUpdate(video._id, { $inc: { views: 1 } });
        video.views += 1;
      }
    }

    // Fetch social stats (likes, comments, isLiked, isSaved)
    const [likeCount, commentCount, isLiked, isSaved] = await Promise.all([
      Like.countDocuments({ video: video._id }),
      Comment.countDocuments({ video: video._id }),
      req.user ? Like.exists({ user: req.user._id, video: video._id }) : false,
      req.user ? Save.exists({ user: req.user._id, video: video._id }) : false
    ]);

    const videoObj = {
      ...video.toObject(),
      likeCount,
      commentCount,
      isLiked: Boolean(isLiked),
      isSaved: Boolean(isSaved)
    };

    return res.status(200).json({
      success: true,
      video: videoObj
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update video metadata (Owner only)
 * @route   PUT /api/videos/:id
 * @access  Private (Owner Only)
 */
const updateVideo = async (req, res, next) => {
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

    // Strict Authorization Check: Only creator can update
    if (video.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this video.'
      });
    }

    const { title, description, category, skills, status, thumbnailUrl } = req.body;

    // Update Title if provided
    if (title !== undefined) {
      const trimmed = title.trim();
      if (trimmed.length < 3 || trimmed.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Video title must be between 3 and 100 characters.'
        });
      }
      video.title = trimmed;
    }

    // Update Description if provided
    if (description !== undefined) {
      const trimmedDesc = description.trim();
      if (trimmedDesc.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot exceed 1000 characters.'
        });
      }
      video.description = trimmedDesc;
    }

    // Update Category if provided
    if (category !== undefined) {
      if (!User.ALLOWED_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Category must be one of: ${User.ALLOWED_CATEGORIES.join(', ')}`
        });
      }
      video.category = category;
    }

    // Update Skills if provided
    if (skills !== undefined) {
      video.skills = parseSkills(skills);
    }

    const wasDraft = video.status === 'draft';
    // Update Status if provided
    if (status !== undefined) {
      if (!['published', 'draft'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be either 'published' or 'draft'."
        });
      }
      video.status = status;
    }

    // Update Thumbnail URL if provided
    if (thumbnailUrl !== undefined) {
      video.thumbnailUrl = thumbnailUrl.trim();
    }

    // Note: creator, views, videoUrl, publicId are immutable
    const updatedVideo = await video.save();
    const populated = await Video.findById(updatedVideo._id).populate(
      'creator',
      '_id displayName username profileImage bio'
    );

    if (wasDraft && updatedVideo.status === 'published') {
      createNotification({
        recipient: req.user._id,
        sender: null,
        type: 'VIDEO_PUBLISHED',
        message: `Your showcase "${updatedVideo.title}" is now published on Spotly!`,
        video: updatedVideo._id
      }).catch((e) => console.warn('Failed to send video published notification:', e.message));
    }

    return res.status(200).json({
      success: true,
      message: 'Video metadata updated successfully.',
      video: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete video asset, thumbnail asset, and document (Owner only)
 * @route   DELETE /api/videos/:id
 * @access  Private (Owner Only)
 */
const deleteVideo = async (req, res, next) => {
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

    // Strict Authorization Check: Only creator can delete
    if (video.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this video.'
      });
    }

    // 1. Delete Video Asset from Cloudinary
    if (video.publicId) {
      console.log(`🗑️ Deleting Cloudinary video asset: ${video.publicId}`);
      await deleteVideoAsset(video.publicId);
    }

    // 2. Delete Associated Thumbnail Asset from Cloudinary
    if (video.thumbnailPublicId) {
      console.log(`🗑️ Deleting Cloudinary thumbnail asset: ${video.thumbnailPublicId}`);
      await deleteThumbnailAsset(video.thumbnailPublicId);
    }

    // 3. Delete document from MongoDB
    await Video.findByIdAndDelete(id);

    // 4. Cascade delete associated social interactions (Likes, Comments, Saves, Notifications)
    await Promise.all([
      Like.deleteMany({ video: id }),
      Comment.deleteMany({ video: id }),
      Save.deleteMany({ video: id }),
      deleteNotificationsForVideo(id)
    ]);

    return res.status(200).json({
      success: true,
      message: 'Video and associated media assets deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get published videos for a specific creator by username (Excludes Drafts)
 * @route   GET /api/videos/user/:username
 * @access  Public
 */
const getCreatorVideos = async (req, res, next) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username parameter is required.'
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const creator = await User.findOne({ username: cleanUsername });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: `Creator '@${cleanUsername}' not found.`
      });
    }

    // Enforce Draft Privacy: Only status: 'published' videos are returned publicly
    const rawVideos = await Video.find({
      creator: creator._id,
      status: 'published'
    })
      .sort({ createdAt: -1 })
      .populate('creator', '_id displayName username profileImage');

    const videos = await enrichVideosWithSocial(rawVideos, req.user?._id);

    return res.status(200).json({
      success: true,
      count: videos.length,
      videos
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVideo,
  getMyVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  getCreatorVideos
};
