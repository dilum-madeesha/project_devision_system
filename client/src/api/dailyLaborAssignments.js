import api from './config.js';

export const dailyLaborAssignmentAPI = {
  getById: async (id) => {
    try {
      const response = await api.get(`/daily-labor-assignments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Labor Assignment by ID API Error:', error);
      throw error;
    }
  },

  updateById: async (id, assignmentData) => {
    try {
      const response = await api.put(`/daily-labor-assignments/${id}`, assignmentData);
      return response.data;
    } catch (error) {
      console.error('Update Labor Assignment API Error:', error);
      throw error;
    }
  },

  getByDailyLaborCostId: async (dailyLaborCostId) => {
    try {
      const response = await api.get(`/daily-labor-assignments/daily-labor-cost/${dailyLaborCostId}`);
      return response.data;
    } catch (error) {
      console.error('Get Labor Assignments by Daily Labor Cost API Error:', error);
      throw error;
    }
  },
  
  getByLaborId: async (laborId) => {
    try {
      const response = await api.get(`/daily-labor-assignments/labor/${laborId}`);
      return response.data;
    } catch (error) {
      console.error('Get Labor Assignments by Labor API Error:', error);
      throw error;
    }
  },
  
  getByJobId: async (jobId) => {
    try {
      const response = await api.get(`/daily-labor-assignments/job/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Get Labor Assignments by Job API Error:', error);
      throw error;
    }
  },
  
  getByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get(`/daily-labor-assignments/date-range?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('Get Labor Assignments by Date Range API Error:', error);
      throw error;
    }
  },
  
  getLaborWorkSummary: async (laborId, startDate, endDate) => {
    try {
      const response = await api.get(`/daily-labor-assignments/labor/${laborId}/summary?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('Get Labor Work Summary API Error:', error);
      throw error;
    }
  }
};
