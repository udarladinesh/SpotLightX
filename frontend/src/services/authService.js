import apiClient from './api';

/**
 * Register a new user account
 * @param {Object} userData - { displayName, username, email, password, confirmPassword, categories, skills }
 */
export const register = async (userData) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};

/**
 * Log in an existing user
 * @param {Object} credentials - { identifier (or email/username), password }
 */
export const login = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

/**
 * Get current authenticated user details (/api/auth/me)
 */
export const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

/**
 * Logout notification to backend
 */
export const logout = async () => {
  try {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  } catch (error) {
    // Gracefully handle logout even if backend fails
    return { success: true };
  }
};
