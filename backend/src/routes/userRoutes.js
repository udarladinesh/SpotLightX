const express = require('express');
const router = express.Router();
const {
  getOwnProfile,
  updateOwnProfile,
  getPublicProfile
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Protected profile management
router.get('/profile', protect, getOwnProfile);
router.put('/profile', protect, updateOwnProfile);

// Public creator profile by username
router.get('/:username', getPublicProfile);

module.exports = router;
