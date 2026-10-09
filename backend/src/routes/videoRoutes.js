const express = require('express');
const router = express.Router();
const {
  createVideo,
  getMyVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  getCreatorVideos
} = require('../controllers/videoController');
const {
  likeVideo,
  unlikeVideo,
  getLikeStatus
} = require('../controllers/likeController');
const {
  saveVideo,
  unsaveVideo,
  getSaveStatus
} = require('../controllers/saveController');
const {
  getVideoComments,
  addComment,
  deleteComment
} = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { handleUpload } = require('../middleware/uploadMiddleware');

// ---------------------- Video CRUD Routes ----------------------

// Protected: Upload new video
router.post('/', protect, handleUpload, createVideo);

// Protected: Get logged-in creator's uploaded videos
router.get('/my', protect, getMyVideos);

// Public: Get published videos of a creator by username
router.get('/user/:username', optionalAuth, getCreatorVideos);

// ---------------------- Like Routes ----------------------

// Protected: Like a video
router.post('/:id/like', protect, likeVideo);

// Protected: Unlike a video
router.delete('/:id/like', protect, unlikeVideo);

// Protected: Get like status
router.get('/:id/like-status', protect, getLikeStatus);

// ---------------------- Save / Bookmark Routes ----------------------

// Protected: Save a video
router.post('/:id/save', protect, saveVideo);

// Protected: Unsave a video
router.delete('/:id/save', protect, unsaveVideo);

// Protected: Get save status
router.get('/:id/save-status', protect, getSaveStatus);

// ---------------------- Comment Routes ----------------------

// Public (Published) / Creator (Draft): Get comments for video
router.get('/:videoId/comments', optionalAuth, getVideoComments);

// Protected: Post a comment to a video
router.post('/:videoId/comments', protect, addComment);

// Protected: Delete own comment
router.delete('/:videoId/comments/:commentId', protect, deleteComment);

// ---------------------- Single Video Metadata Routes ----------------------

// Public / Semi-Private (Drafts viewable by owner): Get single video by ID
router.get('/:id', optionalAuth, getVideoById);

// Protected: Update own video metadata
router.put('/:id', protect, updateVideo);

// Protected: Delete own video & Cloudinary media asset
router.delete('/:id', protect, deleteVideo);

module.exports = router;
