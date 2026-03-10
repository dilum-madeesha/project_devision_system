import api from './config.js';

export const dailyLaborCostAPI = {
  getAll: async (page = 1, pageSize = 10) => {
    try {
      const response = await api.get('/daily-labor-costs', {
        params: {
          page,
          pageSize
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get Daily Labor Costs API Error:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/daily-labor-costs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Daily Labor Cost by ID API Error:', error);
      throw error;
    }
  },
  
  getByDate: async (date) => {
    try {
      const response = await api.get(`/daily-labor-costs/date/${date}`);
      return response.data;
    } catch (error) {
      console.error('Get Daily Labor Costs by Date API Error:', error);
      throw error;
    }
  },
  
  getByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get(`/daily-labor-costs/range?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('Get Daily Labor Costs by Date Range API Error:', error);
      throw error;
    }
  },
  
  create: async (costData) => {
    try {
      const response = await api.post('/daily-labor-costs', costData);
      return response.data;
    } catch (error) {
      console.error('Create Daily Labor Cost API Error:', error);
      throw error;
    }
  },
  
  update: async (id, costData) => {
    try {
      const response = await api.put(`/daily-labor-costs/${id}`, costData);
      return response.data;
    } catch (error) {
      console.error('Update Daily Labor Cost API Error:', error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      const response = await api.delete(`/daily-labor-costs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Daily Labor Cost API Error:', error);
      throw error;
    }
  },
  
  getByJob: async (jobId) => {
    try {
      const response = await api.get(`/daily-labor-costs/job/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Get Daily Labor Costs by Job API Error:', error);
      throw error;
    }
  },
  
  getByLabor: async (laborId) => {
    try {
      const response = await api.get(`/daily-labor-costs/labor/${laborId}`);
      return response.data;
    } catch (error) {
      console.error('Get Daily Labor Costs by Labor API Error:', error);
      throw error;
    }
  }
};
