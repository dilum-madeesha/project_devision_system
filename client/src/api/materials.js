import api from './config.js';

export const materialAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/materials', { params });
      return response.data;
    } catch (error) {
      console.error('Get Materials API Error:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/materials/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Material API Error:', error);
      throw error;
    }
  },

  create: async (materialData) => {
    try {
      const response = await api.post('/materials', materialData);
      return response.data;
    } catch (error) {
      console.error('Create Material API Error:', error);
      throw error;
    }
  },

  update: async (id, materialData) => {
    try {
      const response = await api.put(`/materials/${id}`, materialData);
      return response.data;
    } catch (error) {
      console.error('Update Material API Error:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/materials/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Material API Error:', error);
      throw error;
    }
  },

  search: async (searchTerm) => {
    try {
      const response = await api.get('/materials/search', {
        params: { q: searchTerm }
      });
      return response.data;
    } catch (error) {
      console.error('Search Materials API Error:', error);
      throw error;
    }
  }
};
