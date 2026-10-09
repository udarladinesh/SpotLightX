import apiClient from './api';

/**
 * Fetch Fresh published videos
 * @param {Object} params - { page, limit, category }
 */
export const fetchFreshVideos = async ({ page = 1, limit = 12, category = '' } = {}) => {
  const params = { page, limit };
  if (category && category.trim()) {
    params.category = category.trim();
  }
  const response = await apiClient.get('/discover/fresh', { params });
  return response.data;
};

/**
 * Fetch Trending published videos
 * @param {Object} params - { page, limit, category }
 */
export const fetchTrendingVideos = async ({ page = 1, limit = 12, category = '' } = {}) => {
  const params = { page, limit };
  if (category && category.trim()) {
    params.category = category.trim();
  }
  const response = await apiClient.get('/discover/trending', { params });
  return response.data;
};

/**
 * Fetch Following feed (authenticated user)
 * @param {Object} params - { page, limit, category }
 */
export const fetchFollowingVideos = async ({ page = 1, limit = 12, category = '' } = {}) => {
  const params = { page, limit };
  if (category && category.trim()) {
    params.category = category.trim();
  }
  const response = await apiClient.get('/discover/following', { params });
  return response.data;
};
