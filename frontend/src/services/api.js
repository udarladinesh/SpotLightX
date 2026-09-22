import axios from 'axios';

// Resolve base API URL from environment or default to local backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
  : '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Perform a health check call against the backend and measure roundtrip latency
 */
export const checkBackendHealth = async () => {
  const startTime = performance.now();
  try {
    const response = await apiClient.get('/health');
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    return {
      success: true,
      data: response.data,
      latency,
      status: response.status,
      timestamp: new Date().toLocaleTimeString(),
    };
  } catch (error) {
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    let errorMessage = 'Unable to reach backend server.';
    if (error.response) {
      errorMessage = error.response.data?.message || `Server error (${error.response.status})`;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out after 8 seconds.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      latency,
      status: error.response?.status || 0,
      timestamp: new Date().toLocaleTimeString(),
    };
  }
};

export default apiClient;
