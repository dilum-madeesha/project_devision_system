import api from './config.js';

export const officerAPI = {
  // Get all officers
  getAll: async () => {
    try {
      const response = await api.get('/officers');
      return response.data;
    } catch (error) {
      console.error('Get Officers API Error:', error);
      throw error;
    }
  },

  // Get officer by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/officers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Officer by ID API Error:', error);
      throw error;
    }
  },

  // Create a new officer
  create: async (officerData) => {
    try {
      const response = await api.post('/officers', officerData);
      return response.data;
    } catch (error) {
      console.error('Create Officer API Error:', error);
      throw error;
    }
  },

  // Update an existing officer
  update: async (id, officerData) => {
    try {
      const response = await api.put(`/officers/${id}`, officerData);
      return response.data;
    } catch (error) {
      console.error('Update Officer API Error:', error);
      throw error;
    }
  },

  // Delete an officer
  delete: async (id) => {
    try {
      const response = await api.delete(`/officers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Officer API Error:', error);
      throw error;
    }
  },
};
