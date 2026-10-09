import apiClient from './api';

/**
 * Search published videos with optional filters and pagination
 * @param {Object} params - { q, category, skill, page, limit }
 */
export const searchVideos = async ({ q = '', category = '', skill = '', page = 1, limit = 12 } = {}) => {
  const params = { page, limit };

  if (q && q.trim()) {
    params.q = q.trim();
  }

  if (category && category.trim()) {
    params.category = category.trim();
  }

  if (skill && skill.trim()) {
    params.skill = skill.trim();
  }

  const response = await apiClient.get('/search/videos', { params });
  return response.data;
};

/**
 * Search creator profiles with optional filters and pagination
 * @param {Object} params - { q, category, skill, page, limit }
 */
export const searchCreators = async ({ q = '', category = '', skill = '', page = 1, limit = 12 } = {}) => {
  const params = { page, limit };

  if (q && q.trim()) {
    params.q = q.trim();
  }

  if (category && category.trim()) {
    params.category = category.trim();
  }

  if (skill && skill.trim()) {
    params.skill = skill.trim();
  }

  const response = await apiClient.get('/search/creators', { params });
  return response.data;
};
