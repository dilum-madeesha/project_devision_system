import api from './config.js';

export const materialOrderAssignmentAPI = {
  createMultiple: async (materialOrderAssignments) => {
    try {
      const response = await api.post('/material-order-assignments/create-multiple', {
        materialOrderAssignments
      });
      return response.data;
    } catch (error) {
      console.error('Create Material Order Assignments API Error:', error);
      throw error;
    }
  },

  getByMaterialOrderId: async (materialOrderId) => {
    try {
      const response = await api.get(`/material-order-assignments/material-order/${materialOrderId}`);
      return response.data;
    } catch (error) {
      console.error('Get Material Order Assignments API Error:', error);
      throw error;
    }
  },

  getByJobAndDate: async (jobId, date) => {
    try {
      const response = await api.get(`/material-order-assignments/job-date?jobId=${jobId}&date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Get Material Order Assignments by Job and Date API Error:', error);
      throw error;
    }
  },

  getByMaterialId: async (materialId) => {
    try {
      const response = await api.get(`/material-order-assignments/material/${materialId}`);
      return response.data;
    } catch (error) {
      console.error('Get Material Order Assignments by Material API Error:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/material-order-assignments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Material Order Assignment API Error:', error);
      throw error;
    }
  },

  updateById: async (id, data) => {
    try {
      const response = await api.put(`/material-order-assignments/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update Material Order Assignment API Error:', error);
      throw error;
    }
  },

  deleteById: async (id) => {
    try {
      const response = await api.delete(`/material-order-assignments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Material Order Assignment API Error:', error);
      throw error;
    }
  },

  getSummaryByMaterialOrderId: async (materialOrderId) => {
    try {
      const response = await api.get(`/material-order-assignments/summary/material-order/${materialOrderId}`);
      return response.data;
    } catch (error) {
      console.error('Get Material Order Assignment Summary API Error:', error);
      throw error;
    }
  }
};
