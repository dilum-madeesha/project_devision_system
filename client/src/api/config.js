import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This enables sending cookies
  timeout: 10000, // 10 second timeout
});
// 'http://trainings.airport.lk:5000/api'


// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't set Content-Type for FormData - let axios handle it automatically with proper boundary
    if (config.data instanceof FormData) {
      // remove both header variants in case axios normalized the key
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('Server connection failed. Please ensure the server is running on http://localhost:5000');
      return Promise.reject({
        response: {
          data: {
            message: 'Cannot connect to server. Please ensure the server is running.',
            errors: {}
          }
        }
      });
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        response: {
          data: {
            message: 'Request timeout. Please try again.',
            errors: {}
          }
        }
      });
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // first check if we have a stored token; it may be undefined when
        // the server is using httpOnly cookies only - that's okay.
        const storedRT = localStorage.getItem('refreshToken');

        let response;
        if (storedRT) {
          response = await api.post('/auth/refresh-token', { refreshToken: storedRT });
        } else {
          // send empty body; server will read cookie (if it exists)
          response = await api.post('/auth/refresh-token');
        }

        const newToken = response.data?.data?.token || response.data?.token || null;
        const newRefresh = response.data?.data?.refreshToken || response.data?.refreshToken || null;
        if (newToken) {
          localStorage.setItem('authToken', newToken);
          if (newRefresh) {
            localStorage.setItem('refreshToken', newRefresh);
          }
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear stored tokens and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
