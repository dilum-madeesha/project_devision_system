import api from './config.js';

export const agreementAPI = {
  // Get all agreements
  getAll: async () => {
    try {
      const response = await api.get('/agreements');
      return response.data;
    } catch (error) {
      console.error('Get Agreements API Error:', error);
      throw error;
    }
  },

  // Alias for getAll
  getAllAgreements: async () => {
    try {
      const response = await api.get('/agreements');
      return response.data;
    } catch (error) {
      console.error('Get Agreements API Error:', error);
      throw error;
    }
  },

  // Get agreement by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/agreements/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Agreement by ID API Error:', error);
      throw error;
    }
  },

  // Create a new agreement
  create: async (agreementData) => {
    try {
      const response = await api.post('/agreements', agreementData);
      return response.data;
    } catch (error) {
      console.error('Create Agreement API Error:', error);
      throw error;
    }
  },

  // Update an existing agreement
  update: async (id, agreementData) => {
    try {
      const response = await api.put(`/agreements/${id}`, agreementData);
      return response.data;
    } catch (error) {
      console.error('Update Agreement API Error:', error);
      throw error;
    }
  },

  // Alias for update
  updateAgreement: async (id, agreementData) => {
    try {
      const response = await api.put(`/agreements/${id}`, agreementData);
      return response.data;
    } catch (error) {
      console.error('Update Agreement API Error:', error);
      throw error;
    }
  },

  // Delete an agreement
  delete: async (id) => {
    try {
      const response = await api.delete(`/agreements/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Agreement API Error:', error);
      throw error;
    }
  },
};
