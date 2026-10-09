import apiClient from './api';

/**
 * Fetch creator high-level summary overview
 */
export const getOverview = async () => {
  const response = await apiClient.get('/analytics/overview');
  return response.data;
};

/**
 * Fetch paginated published video analytics for the authenticated creator
 * @param {number} page
 * @param {number} limit
 */
export const getVideoAnalytics = async (page = 1, limit = 10) => {
  const response = await apiClient.get('/analytics/videos', {
    params: { page, limit }
  });
  return response.data;
};

/**
 * Fetch creator's top 5 performing published videos by engagement score
 */
export const getTopVideos = async () => {
  const response = await apiClient.get('/analytics/top-videos');
  return response.data;
};

/**
 * Fetch follower growth and metrics for selected period (7d, 30d, 90d, all)
 * @param {string} period
 */
export const getFollowerAnalytics = async (period = '30d') => {
  const response = await apiClient.get('/analytics/followers', {
    params: { period }
  });
  return response.data;
};

/**
 * Fetch recent interaction activity stream for the creator
 * @param {number} limit
 */
export const getRecentActivity = async (limit = 15) => {
  const response = await apiClient.get('/analytics/activity', {
    params: { limit }
  });
  return response.data;
};
