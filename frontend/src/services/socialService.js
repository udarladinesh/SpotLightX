import apiClient from './api';

/**
 * Like a video
 * @param {string} videoId
 */
export const likeVideo = async (videoId) => {
  const response = await apiClient.post(`/videos/${videoId}/like`);
  return response.data;
};

/**
 * Unlike a video
 * @param {string} videoId
 */
export const unlikeVideo = async (videoId) => {
  const response = await apiClient.delete(`/videos/${videoId}/like`);
  return response.data;
};

/**
 * Get like status for a video
 * @param {string} videoId
 */
export const getLikeStatus = async (videoId) => {
  const response = await apiClient.get(`/videos/${videoId}/like-status`);
  return response.data;
};

/**
 * Save / Bookmark a video
 * @param {string} videoId
 */
export const saveVideo = async (videoId) => {
  const response = await apiClient.post(`/videos/${videoId}/save`);
  return response.data;
};

/**
 * Unsave / Remove bookmark for a video
 * @param {string} videoId
 */
export const unsaveVideo = async (videoId) => {
  const response = await apiClient.delete(`/videos/${videoId}/save`);
  return response.data;
};

/**
 * Get save status for a video
 * @param {string} videoId
 */
export const getSaveStatus = async (videoId) => {
  const response = await apiClient.get(`/videos/${videoId}/save-status`);
  return response.data;
};

/**
 * Get current user's saved videos
 * @param {number} page
 * @param {number} limit
 */
export const getSavedVideos = async (page = 1, limit = 12) => {
  const response = await apiClient.get(`/users/me/saved-videos?page=${page}&limit=${limit}`);
  return response.data;
};

/**
 * Get comments for a video
 * @param {string} videoId
 * @param {number} page
 * @param {number} limit
 */
export const getVideoComments = async (videoId, page = 1, limit = 20) => {
  const response = await apiClient.get(`/videos/${videoId}/comments?page=${page}&limit=${limit}`);
  return response.data;
};

/**
 * Add a comment to a video
 * @param {string} videoId
 * @param {string} text
 */
export const addComment = async (videoId, text) => {
  const response = await apiClient.post(`/videos/${videoId}/comments`, { text });
  return response.data;
};

/**
 * Delete a comment from a video
 * @param {string} videoId
 * @param {string} commentId
 */
export const deleteComment = async (videoId, commentId) => {
  const response = await apiClient.delete(`/videos/${videoId}/comments/${commentId}`);
  return response.data;
};

/**
 * Follow a user/creator
 * @param {string} userId
 */
export const followUser = async (userId) => {
  const response = await apiClient.post(`/users/${userId}/follow`);
  return response.data;
};

/**
 * Unfollow a user/creator
 * @param {string} userId
 */
export const unfollowUser = async (userId) => {
  const response = await apiClient.delete(`/users/${userId}/follow`);
  return response.data;
};

/**
 * Get follow status for a user/creator
 * @param {string} userId
 */
export const getFollowStatus = async (userId) => {
  const response = await apiClient.get(`/users/${userId}/follow-status`);
  return response.data;
};

/**
 * Get followers of a user/creator
 * @param {string} userId
 * @param {number} page
 * @param {number} limit
 */
export const getUserFollowers = async (userId, page = 1, limit = 20) => {
  const response = await apiClient.get(`/users/${userId}/followers?page=${page}&limit=${limit}`);
  return response.data;
};

/**
 * Get accounts followed by a user/creator
 * @param {string} userId
 * @param {number} page
 * @param {number} limit
 */
export const getUserFollowing = async (userId, page = 1, limit = 20) => {
  const response = await apiClient.get(`/users/${userId}/following?page=${page}&limit=${limit}`);
  return response.data;
};

/**
 * Get follower & following counts for a user/creator
 * @param {string} userId
 */
export const getUserSocialStats = async (userId) => {
  const response = await apiClient.get(`/users/${userId}/social-stats`);
  return response.data;
};
