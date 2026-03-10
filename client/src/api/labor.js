import api from './config.js';

export const laborAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/labors');
      return response.data;
    } catch (error) {
      console.error('Get Labors API Error:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/labors/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Labor by ID API Error:', error);
      throw error;
    }
  },
  
  create: async (laborData) => {
    try {
      const response = await api.post('/labors', laborData);
      return response.data;
    } catch (error) {
      console.error('Create Labor API Error:', error);
      throw error;
    }
  },
  
  update: async (id, laborData) => {
    try {
      const response = await api.put(`/labors/${id}`, laborData);
      return response.data;
    } catch (error) {
      console.error('Update Labor API Error:', error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      const response = await api.delete(`/labors/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Labor API Error:', error);
      throw error;
    }
  }
};
