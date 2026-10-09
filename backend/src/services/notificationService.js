const mongoose = require('mongoose');
const Notification = require('../models/Notification');

/**
 * Create a new notification safely
 * Prevents self-notifications and duplicate unread notifications for identical actions
 * @param {Object} options
 * @param {ObjectId|string} options.recipient - User receiving the notification
 * @param {ObjectId|string|null} options.sender - User initiating the action
 * @param {string} options.type - One of FOLLOW, LIKE, COMMENT, SAVE, VIDEO_PUBLISHED
 * @param {string} options.message - Human-readable notification description
 * @param {ObjectId|string|null} options.video - Optional reference to Video
 * @param {ObjectId|string|null} options.comment - Optional reference to Comment
 */
async function createNotification({
  recipient,
  sender = null,
  type,
  message,
  video = null,
  comment = null
}) {
  try {
    if (!recipient) return null;

    const recipientId = recipient.toString();
    const senderId = sender ? sender.toString() : null;

    // 1. Guard against self-action notifications (e.g., liking/commenting/saving own video)
    if (senderId && senderId === recipientId) {
      return null;
    }

    // 2. Duplicate prevention for idempotency
    if (senderId) {
      const duplicateQuery = {
        recipient: recipientId,
        sender: senderId,
        type: type,
        isRead: false
      };

      if (video) {
        duplicateQuery.video = video;
      }

      const existingUnread = await Notification.findOne(duplicateQuery);
      if (existingUnread) {
        return existingUnread;
      }
    }

    // 3. Prevent duplicate VIDEO_PUBLISHED notification for same video
    if (type === 'VIDEO_PUBLISHED' && video) {
      const existingPub = await Notification.findOne({
        recipient: recipientId,
        type: 'VIDEO_PUBLISHED',
        video: video
      });
      if (existingPub) {
        return existingPub;
      }
    }

    // 4. Create and return notification
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      video,
      comment
    });

    return notification;
  } catch (error) {
    console.warn(`[NotificationService] Warning: Failed to create notification (${type}):`, error.message);
    return null;
  }
}

/**
 * Fetch paginated notifications for an authenticated user (newest first)
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {number} params.page
 * @param {number} params.limit
 */
async function getNotificationsForUser({ userId, page = 1, limit = 20 }) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const query = { recipient: userId };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('sender', '_id displayName username profileImage bio')
      .populate('video', '_id title thumbnailUrl category status')
      .populate('comment', '_id text'),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: userId, isRead: false })
  ]);

  const totalPages = Math.ceil(total / safeLimit) || (total === 0 ? 0 : 1);
  const hasNextPage = safePage * safeLimit < total;

  return {
    notifications,
    total,
    totalPages,
    page: safePage,
    limit: safeLimit,
    hasNextPage,
    unreadCount,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage
    }
  };
}

/**
 * Get count of unread notifications for a user
 * @param {ObjectId|string} userId
 */
async function getUnreadCountForUser(userId) {
  return await Notification.countDocuments({
    recipient: userId,
    isRead: false
  });
}

/**
 * Mark a single notification as read
 * @param {Object} params
 * @param {ObjectId|string} params.notificationId
 * @param {ObjectId|string} params.userId
 */
async function markNotificationAsRead({ notificationId, userId }) {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return null;
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { isRead: true } },
    { new: true }
  )
    .populate('sender', '_id displayName username profileImage')
    .populate('video', '_id title thumbnailUrl category');

  return notification;
}

/**
 * Mark all unread notifications for a user as read
 * @param {ObjectId|string} userId
 */
async function markAllNotificationsAsRead(userId) {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true } }
  );

  return {
    updatedCount: result.modifiedCount || 0
  };
}

/**
 * Delete a single notification (recipient only)
 * @param {Object} params
 * @param {ObjectId|string} params.notificationId
 * @param {ObjectId|string} params.userId
 */
async function deleteNotification({ notificationId, userId }) {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return null;
  }

  const deleted = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId
  });

  return deleted;
}

/**
 * Cleanup notifications referencing a deleted video
 * @param {ObjectId|string} videoId
 */
async function deleteNotificationsForVideo(videoId) {
  if (!videoId) return;
  try {
    await Notification.deleteMany({ video: videoId });
  } catch (e) {
    console.warn('Failed to delete notifications for video:', e.message);
  }
}

/**
 * Cleanup notifications referencing a deleted comment
 * @param {ObjectId|string} commentId
 */
async function deleteNotificationsForComment(commentId) {
  if (!commentId) return;
  try {
    await Notification.deleteMany({ comment: commentId });
  } catch (e) {
    console.warn('Failed to delete notifications for comment:', e.message);
  }
}

module.exports = {
  createNotification,
  getNotificationsForUser,
  getUnreadCountForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteNotificationsForVideo,
  deleteNotificationsForComment
};
