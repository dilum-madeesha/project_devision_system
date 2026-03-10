import api from './config.js';

export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login API Error:', error);
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Register API Error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Logout API Error:', error);
      throw error;
    }
  },
  
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      return response.data;
    } catch (error) {
      console.error('Refresh Token API Error:', error);
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      // Use check-session endpoint which doesn't require authentication
      const response = await api.get('/auth/check-session');
      if (response.data.authenticated) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, data: null, message: 'Not authenticated' };
      }
    } catch (error) {
      // If 401 (unauthorized), return null gracefully instead of throwing
      if (error.response?.status === 401) {
        console.log('User not authenticated');
        return { success: false, data: null, message: 'Not authenticated' };
      }
      console.error('Get Current User API Error:', error);
      // Return gracefully instead of throwing for network errors
      return { success: false, data: null, message: 'Failed to check session' };
    }
  },
  
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Update Profile API Error:', error);
      throw error;
    }
  },
  
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Change Password API Error:', error);
      throw error;
    }
  }
};
