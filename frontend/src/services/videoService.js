import apiClient from './api';

/**
 * Upload a video file with metadata and upload progress tracking
 * @param {FormData} formData - Multipart form data containing 'video', optional 'thumbnail', title, description, category, skills
 * @param {Function} onProgress - Callback receiving (progressPercent)
 */
export const uploadVideo = async (formData, onProgress = null) => {
  const response = await apiClient.post('/videos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  });
  return response.data;
};

/**
 * Get all videos created by the authenticated user
 */
export const getMyVideos = async () => {
  const response = await apiClient.get('/videos/my');
  return response.data;
};

/**
 * Get a single video by ID
 * @param {string} id - Video ObjectId
 */
export const getVideoById = async (id) => {
  const response = await apiClient.get(`/videos/${id}`);
  return response.data;
};

/**
 * Update video metadata (Owner only)
 * @param {string} id - Video ObjectId
 * @param {Object} videoData - { title, description, category, skills, status, thumbnailUrl }
 */
export const updateVideo = async (id, videoData) => {
  const response = await apiClient.put(`/videos/${id}`, videoData);
  return response.data;
};

/**
 * Delete a video and its cloud storage assets (Owner only)
 * @param {string} id - Video ObjectId
 */
export const deleteVideo = async (id) => {
  const response = await apiClient.delete(`/videos/${id}`);
  return response.data;
};

/**
 * Get all published videos of a creator by username
 * @param {string} username
 */
export const getCreatorVideos = async (username) => {
  const response = await apiClient.get(`/videos/user/${encodeURIComponent(username)}`);
  return response.data;
};
