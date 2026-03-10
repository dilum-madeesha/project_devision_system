import api from './config.js';

export const dailyJobCostAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/daily-job-costs');
      return response.data;
    } catch (error) {
      console.error('Get Daily Job Costs API Error:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/daily-job-costs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Daily Job Cost by ID API Error:', error);
      throw error;
    }
  },
  
  create: async (costData) => {
    try {
      const response = await api.post('/daily-job-costs', costData);
      return response.data;
    } catch (error) {
      console.error('Create Daily Job Cost API Error:', error);
      throw error;
    }
  },
  
  update: async (id, costData) => {
    try {
      const response = await api.put(`/daily-job-costs/${id}`, costData);
      return response.data;
    } catch (error) {
      console.error('Update Daily Job Cost API Error:', error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      const response = await api.delete(`/daily-job-costs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Daily Job Cost API Error:', error);
      throw error;
    }
  },
  
  getByJob: async (jobId) => {
    try {
      const response = await api.get(`/daily-job-costs/job/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Get Daily Job Costs by Job API Error:', error);
      throw error;
    }
  }
};
