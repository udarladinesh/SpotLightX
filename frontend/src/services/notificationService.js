import apiClient from './api';

/**
 * Fetch paginated notifications for the authenticated user
 * @param {Object} params - { page, limit }
 */
export const getNotifications = async ({ page = 1, limit = 20 } = {}) => {
  const response = await apiClient.get('/notifications', {
    params: { page, limit }
  });
  return response.data;
};

/**
 * Fetch count of unread notifications for the authenticated user
 */
export const getUnreadCount = async () => {
  const response = await apiClient.get('/notifications/unread-count');
  return response.data;
};

/**
 * Mark a single notification as read
 * @param {string} id - Notification ID
 */
export const markNotificationAsRead = async (id) => {
  const response = await apiClient.patch(`/notifications/${id}/read`);
  return response.data;
};

/**
 * Mark all unread notifications as read
 */
export const markAllNotificationsAsRead = async () => {
  const response = await apiClient.patch('/notifications/read-all');
  return response.data;
};

/**
 * Delete a single notification
 * @param {string} id - Notification ID
 */
export const deleteNotification = async (id) => {
  const response = await apiClient.delete(`/notifications/${id}`);
  return response.data;
};
