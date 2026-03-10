import api from './config.js';

export const jobAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/jobs');
      return response.data;
    } catch (error) {
      console.error('Get Jobs API Error:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Job by ID API Error:', error);
      throw error;
    }
  },
  
  create: async (jobData) => {
    try {
      const response = await api.post('/jobs', jobData);
      return response.data;
    } catch (error) {
      console.error('Create Job API Error:', error);
      throw error;
    }
  },
  
  update: async (id, jobData) => {
    try {
      const response = await api.put(`/jobs/${id}`, jobData);
      return response.data;
    } catch (error) {
      console.error('Update Job API Error:', error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      const response = await api.delete(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Job API Error:', error);
      throw error;
    }
  }
};
