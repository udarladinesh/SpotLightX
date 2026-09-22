import apiClient from './api';

/**
 * Get own full profile
 */
export const getOwnProfile = async () => {
  const response = await apiClient.get('/users/profile');
  return response.data;
};

/**
 * Update own profile
 * @param {Object} profileData - { displayName, bio, profileImage, skills, categories, location, socialLinks }
 */
export const updateOwnProfile = async (profileData) => {
  const response = await apiClient.put('/users/profile', profileData);
  return response.data;
};

/**
 * Get public creator profile by username
 * @param {string} username
 */
export const getPublicProfile = async (username) => {
  const response = await apiClient.get(`/users/${encodeURIComponent(username)}`);
  return response.data;
};
