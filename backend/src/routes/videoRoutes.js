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
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { handleUpload } = require('../middleware/uploadMiddleware');

// Protected: Upload new video
router.post('/', protect, handleUpload, createVideo);

// Protected: Get logged-in creator's uploaded videos
router.get('/my', protect, getMyVideos);

// Public: Get published videos of a creator by username
router.get('/user/:username', getCreatorVideos);

// Public / Semi-Private (Drafts viewable by owner): Get single video by ID
router.get('/:id', optionalAuth, getVideoById);

// Protected: Update own video metadata
router.put('/:id', protect, updateVideo);

// Protected: Delete own video & Cloudinary media asset
router.delete('/:id', protect, deleteVideo);

module.exports = router;
