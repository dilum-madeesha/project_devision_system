import api from './config.js';

export const userAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/auth/users');
      return response.data;
    } catch (error) {
      console.error('Get Users API Error:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/auth/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get User by ID API Error:', error);
      throw error;
    }
  },
  
  create: async (userData) => {
    try {
      const response = await api.post('/auth/users', userData);
      return response.data;
    } catch (error) {
      console.error('Create User API Error:', error);
      throw error;
    }
  },
  
  update: async (id, userData) => {
    try {
      const response = await api.put(`/auth/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error('Update User API Error:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/auth/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete User API Error:', error);
      throw error;
    }
  }
};
