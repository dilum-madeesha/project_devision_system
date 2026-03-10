import api from './config.js';

export const contractorAPI = {
  // Get all contractors
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/contractors', { params });
      return response.data;
    } catch (error) {
      console.error('Get Contractors API Error:', error);
      throw error;
    }
  },
  
  // Alias for getAll
  getAllContractors: async (params = {}) => {
    try {
      const response = await api.get('/contractors', { params });
      return response.data;
    } catch (error) {
      console.error('Get Contractors API Error:', error);
      throw error;
    }
  },

  // Get contractor by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/contractors/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Contractor by ID API Error:', error);
      throw error;
    }
  },

  // Create a new contractor
  create: async (contractorData) => {
    try {
      const response = await api.post('/contractors', contractorData);
      return response.data;
    } catch (error) {
      console.error('Create Contractor API Error:', error);
      throw error;
    }
  },
  
  // Alias for create
  createContractor: async (contractorData) => {
    try {
      const response = await api.post('/contractors', contractorData);
      return response.data;
    } catch (error) {
      console.error('Create Contractor API Error:', error);
      throw error;
    }
  },

  // Update an existing contractor
  update: async (id, contractorData) => {
    try {
      const response = await api.put(`/contractors/${id}`, contractorData);
      return response.data;
    } catch (error) {
      console.error('Update Contractor API Error:', error);
      throw error;
    }
  },
  
  // Alias for update
  updateContractor: async (id, contractorData) => {
    try {
      const response = await api.put(`/contractors/${id}`, contractorData);
      return response.data;
    } catch (error) {
      console.error('Update Contractor API Error:', error);
      throw error;
    }
  },

  // Delete a contractor
  delete: async (id) => {
    try {
      const response = await api.delete(`/contractors/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Contractor API Error:', error);
      throw error;
    }
  },
  
  // Alias for delete
  deleteContractor: async (id) => {
    try {
      const response = await api.delete(`/contractors/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Contractor API Error:', error);
      throw error;
    }
  },
};
