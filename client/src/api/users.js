import api from './config.js';

const serverBaseUrl = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

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
  },

  uploadImage: async (id, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post(`/auth/users/${id}/image`, formData);
      return response.data;
    } catch (error) {
      console.error('Upload User Image API Error:', error);
      throw error;
    }
  },

  deleteImage: async (id) => {
    try {
      const response = await api.delete(`/auth/users/${id}/image`);
      return response.data;
    } catch (error) {
      console.error('Delete User Image API Error:', error);
      throw error;
    }
  },

  toImageSrc: (profileImageUrl) => {
    if (!profileImageUrl) return null;
    if (profileImageUrl.startsWith('http')) return profileImageUrl;
    return `${serverBaseUrl}${profileImageUrl}`;
  }
};
