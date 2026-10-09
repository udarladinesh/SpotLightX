const mongoose = require('mongoose');
const {
  getNotificationsForUser,
  getUnreadCountForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} = require('../services/notificationService');

/**
 * @desc    Get paginated notifications for authenticated user
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotificationsHandler = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await getNotificationsForUser({
      userId: req.user._id,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      count: result.notifications.length,
      total: result.total,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
      hasNextPage: result.hasNextPage,
      unreadCount: result.unreadCount,
      notifications: result.notifications,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread notifications count for authenticated user
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
const getUnreadCountHandler = async (req, res, next) => {
  try {
    const unreadCount = await getUnreadCountForUser(req.user._id);

    return res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markAsReadHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    const notification = await markNotificationAsRead({
      notificationId: id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all unread notifications as read for authenticated user
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
const markAllAsReadHandler = async (req, res, next) => {
  try {
    const result = await markAllNotificationsAsRead(req.user._id);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      updatedCount: result.updatedCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a notification (recipient only)
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotificationHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    const deleted = await deleteNotification({
      notificationId: id,
      userId: req.user._id
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotificationsHandler,
  getUnreadCountHandler,
  markAsReadHandler,
  markAllAsReadHandler,
  deleteNotificationHandler
};
