const express = require('express');
const router = express.Router();
const {
  getOwnProfile,
  updateOwnProfile,
  getPublicProfile
} = require('../controllers/userController');
const {
  getSavedVideos
} = require('../controllers/saveController');
const {
  followUser,
  unfollowUser,
  getFollowStatus,
  getUserFollowers,
  getUserFollowing,
  getUserSocialStats
} = require('../controllers/followController');
const { protect } = require('../middleware/authMiddleware');

// ---------------------- Profile Management ----------------------

// Protected: Get current user's profile
router.get('/profile', protect, getOwnProfile);

// Protected: Update current user's profile
router.put('/profile', protect, updateOwnProfile);

// ---------------------- Saved Videos ----------------------

// Protected: Get saved published videos for authenticated user
router.get('/me/saved-videos', protect, getSavedVideos);
router.get('/saved-videos', protect, getSavedVideos);

// ---------------------- Follow Management ----------------------

// Protected: Follow a creator
router.post('/:userId/follow', protect, followUser);

// Protected: Unfollow a creator
router.delete('/:userId/follow', protect, unfollowUser);

// Protected: Check follow status
router.get('/:userId/follow-status', protect, getFollowStatus);

// Public: Get followers of a user
router.get('/:userId/followers', getUserFollowers);

// Public: Get accounts followed by a user
router.get('/:userId/following', getUserFollowing);

// Public: Get follower and following statistics
router.get('/:userId/social-stats', getUserSocialStats);

// ---------------------- Public Profile ----------------------

// Public: Get public creator profile by username
router.get('/:username', getPublicProfile);

module.exports = router;
