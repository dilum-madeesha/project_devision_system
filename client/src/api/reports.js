import api from './config.js';

export const reportsAPI = {
  // Daily Labor Cost Report APIs
  getDailyLaborCostReport: async (date) => {
    try {
      const response = await api.get(`/daily-labor-costs/date/${date}`);
      return response.data;
    } catch (error) {
      console.error('Get Daily Labor Cost Report API Error:', error);
      throw error;
    }
  },

  // Monthly Labor Cost Report APIs
  getMonthlyLaborCostReport: async (startDate, endDate) => {
    try {
      const response = await api.get(`/daily-labor-costs/range?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('Get Monthly Labor Cost Report API Error:', error);
      throw error;
    }
  },

  // Weekly Labor Cost Report APIs
  getWeeklyLaborCostReport: async (startDate, endDate) => {
    try {
      const response = await api.get(`/daily-labor-costs/range?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('Get Weekly Labor Cost Report API Error:', error);
      throw error;
    }
  },

  // Yearly Labor Cost Report APIs
  getYearlyLaborCostReport: async (startDate, endDate) => {
    try {
      const response = await api.get(`/daily-labor-costs/range?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('Get Yearly Labor Cost Report API Error:', error);
      throw error;
    }
  },

  // Material Cost Report APIs
  getDailyMaterialCostReport: async (date) => {
    try {
      const response = await api.get(`/material-orders/date/${date}`);
      return response.data;
    } catch (error) {
      console.error('Get Daily Material Cost Report API Error:', error);
      throw error;
    }
  },

  getMonthlyMaterialCostReport: async (startDate, endDate) => {
    try {
      const response = await api.get(`/material-orders/range?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('Get Monthly Material Cost Report API Error:', error);
      throw error;
    }
  },

  getYearlyMaterialCostReport: async (startDate, endDate) => {
    try {
      const response = await api.get(`/material-orders/range?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('Get Yearly Material Cost Report API Error:', error);
      throw error;
    }
  },

  // Job Total Cost Report APIs
  getJobTotalCostReport: async (jobId, startDate = null, endDate = null) => {
    try {
      let url = `/daily-labor-costs/job/${jobId}`;
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      
      const [laborResponse, materialResponse] = await Promise.all([
        api.get(url),
        api.get(`/material-orders/job/${jobId}${startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : ''}`)
      ]);

      return {
        success: true,
        data: {
          labor: laborResponse.data,
          materials: materialResponse.data
        }
      };
    } catch (error) {
      console.error('Get Job Total Cost Report API Error:', error);
      throw error;
    }
  },

  // Labor Assignment Report APIs
  getDailyLaborAssignmentReport: async (date) => {
    try {
      const response = await api.get(`/daily-labor-assignments/date-range?startDate=${date}&endDate=${date}`);
      return response.data;
    } catch (error) {
      console.error('Get Daily Labor Assignment Report API Error:', error);
      throw error;
    }
  },

  // Custom Reports APIs
  getCustomReport: async (filters) => {
    try {
      const response = await api.post('/reports/custom', filters);
      return response.data;
    } catch (error) {
      console.error('Get Custom Report API Error:', error);
      throw error;
    }
  },

  // Export Reports APIs
  exportReportToPDF: async (reportType, reportData, options = {}) => {
    try {
      const response = await api.post('/reports/export/pdf', {
        reportType,
        reportData,
        options
      }, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Export Report to PDF API Error:', error);
      throw error;
    }
  },

  exportReportToExcel: async (reportType, reportData, options = {}) => {
    try {
      const response = await api.post('/reports/export/excel', {
        reportType,
        reportData,
        options
      }, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Export Report to Excel API Error:', error);
      throw error;
    }
  }
};
