const express = require('express');
const router = express.Router();
const {
  getNotificationsHandler,
  getUnreadCountHandler,
  markAsReadHandler,
  markAllAsReadHandler,
  deleteNotificationHandler
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// All notification routes require authentication
router.use(protect);

// ---------------------- Notification Routes ----------------------

// Get paginated notifications
router.get('/', getNotificationsHandler);

// Get unread notification count
router.get('/unread-count', getUnreadCountHandler);

// Mark all notifications as read
router.patch('/read-all', markAllAsReadHandler);

// Mark single notification as read
router.patch('/:id/read', markAsReadHandler);

// Delete single notification
router.delete('/:id', deleteNotificationHandler);

module.exports = router;
