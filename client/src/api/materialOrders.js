import api from './config.js';

export const materialOrderAPI = {
  getAll: async (page = 1, pageSize = 10) => {
    try {
      const response = await api.get('/material-orders', {
        params: {
          page,
          pageSize
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get Material Orders API Error:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/material-orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Material Order by ID API Error:', error);
      throw error;
    }
  },
  
  getByDate: async (date) => {
    try {
      const response = await api.get(`/material-orders/date/${date}`);
      return response.data;
    } catch (error) {
      console.error('Get Material Orders by Date API Error:', error);
      throw error;
    }
  },
  
  getByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get(`/material-orders/range?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('Get Material Orders by Date Range API Error:', error);
      throw error;
    }
  },
  
  create: async (orderData) => {
    try {
      const response = await api.post('/material-orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Create Material Order API Error:', error);
      throw error;
    }
  },
  
  update: async (id, orderData) => {
    try {
      const response = await api.put(`/material-orders/${id}`, orderData);
      return response.data;
    } catch (error) {
      console.error('Update Material Order API Error:', error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      const response = await api.delete(`/material-orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Material Order API Error:', error);
      throw error;
    }
  },
  
  getByJob: async (jobId) => {
    try {
      const response = await api.get(`/material-orders/job/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Get Material Orders by Job API Error:', error);
      throw error;
    }
  },
  
  createMultiple: async (ordersData) => {
    try {
      const response = await api.post('/material-orders/bulk', ordersData);
      return response.data;
    } catch (error) {
      console.error('Create Multiple Material Orders API Error:', error);
      throw error;
    }
  }
};
