import api from './config.js';
import { dailyLaborCostAPI } from './dailyLaborCosts.js';
import { materialOrderAPI } from './materialOrders.js';

// Helper function to get the first day of a week (ISO week standard)
function getDateOfWeek(year, week) {
  // Create January 4th of the given year (always in week 1)
  const jan4 = new Date(year, 0, 4);
  
  // Find the Monday of week 1 (the Monday of the week containing January 4th)
  const jan4Day = jan4.getDay() || 7; // Convert Sunday (0) to 7
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - jan4Day + 1);
  
  // Calculate the start of the requested week
  const weekStart = new Date(week1Monday);
  weekStart.setDate(week1Monday.getDate() + 7 * (week - 1));
  
  return weekStart;
}

export const dashboardAPI = {
  getDailyCosts: async (date) => {
    try {
      // Use current date if no date provided
      const dateToUse = date || new Date().toISOString().split('T')[0];
      console.log('Getting daily costs for date:', dateToUse);
      
      // This would typically be a specialized endpoint in a real backend
      // For now, we'll mock by fetching both labor and material costs and combining them
      const [laborResponse, materialResponse] = await Promise.all([
        dailyLaborCostAPI.getByDate(dateToUse),
        materialOrderAPI.getByDate(dateToUse)
      ]);
      
      // Process and combine the data
      const laborCosts = laborResponse.data || [];
      const materialCosts = materialResponse.data || [];
      
      // Group by job and collect IDs for assignments
      const jobCosts = {};
      
      // Process labor costs - collect all labor cost IDs for each job
      laborCosts.forEach(cost => {
        const jobId = cost.jobId;
        if (!jobCosts[jobId]) {
          jobCosts[jobId] = {
            id: jobId,
            jobNumber: cost.job?.jobNumber || '',
            title: cost.job?.title || '',
            laborCost: 0,
            materialCost: 0,
            dailyLaborCostIds: [], // Array to store all labor cost IDs for this job
            materialOrderIds: []   // Array to store all material order IDs for this job
          };
        }
        jobCosts[jobId].laborCost += parseFloat(cost.cost) || 0;
        if (cost.id) {
          jobCosts[jobId].dailyLaborCostIds.push(cost.id);
        }
      });
      
      // Process material costs - collect all material order IDs for each job
      materialCosts.forEach(order => {
        const jobId = order.jobId;
        if (!jobCosts[jobId]) {
          jobCosts[jobId] = {
            id: jobId,
            jobNumber: order.job?.jobNumber || '',
            title: order.job?.title || '',
            laborCost: 0,
            materialCost: 0,
            dailyLaborCostIds: [],
            materialOrderIds: []
          };
        }
        jobCosts[jobId].materialCost += parseFloat(order.cost) || 0;
        if (order.id) {
          jobCosts[jobId].materialOrderIds.push(order.id);
        }
      });
      
      return {
        success: true,
        data: Object.values(jobCosts),
        totals: {
          laborCost: laborCosts.reduce((sum, cost) => sum + (parseFloat(cost.cost) || 0), 0),
          materialCost: materialCosts.reduce((sum, order) => sum + (parseFloat(order.cost) || 0), 0),
          totalCost: laborCosts.reduce((sum, cost) => sum + (parseFloat(cost.cost) || 0), 0) + 
                     materialCosts.reduce((sum, order) => sum + (parseFloat(order.cost) || 0), 0)
        }
      };
    } catch (error) {
      console.error('Get Daily Costs API Error:', error);
      throw error;
    }
  },
  
  getWeeklyCosts: async (year, week) => {
    try {
      // Ensure week is a string and handle formatting
      const weekStr = String(week);
      const weekNumber = weekStr.includes('W') ? parseInt(weekStr.replace('W', '')) : parseInt(weekStr);
      
      if (isNaN(weekNumber) || isNaN(parseInt(year))) {
        return { 
          success: false, 
          data: [],
          totals: { laborCost: 0, materialCost: 0, totalCost: 0 },
          error: 'Invalid year or week number' 
        };
      }
      
      // Calculate start and end dates for the week
      const startDate = getDateOfWeek(parseInt(year), weekNumber);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      
      // Format dates as YYYY-MM-DD using local date methods to avoid timezone issues
      const formattedStartDate = startDate.getFullYear() + '-' + 
        String(startDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(startDate.getDate()).padStart(2, '0');
      
      const formattedEndDate = endDate.getFullYear() + '-' + 
        String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(endDate.getDate()).padStart(2, '0');
      
      // Debug: Log the calculated date range
      console.log(`API calculated date range for Week ${weekNumber}, ${year}: ${formattedStartDate} to ${formattedEndDate}`);
      
      // Fetch data for the date range
      let laborResponse = { data: [] };
      let materialResponse = { data: [] };
      try {
        [laborResponse, materialResponse] = await Promise.all([
          dailyLaborCostAPI.getByDateRange(formattedStartDate, formattedEndDate),
          materialOrderAPI.getByDateRange(formattedStartDate, formattedEndDate)
        ]);
      } catch (apiError) {
        console.error('Error in API calls:', apiError);
        // Continue with empty data rather than failing completely
      }
      
      // Process and combine the data (similar to daily costs but for a week)
      // Check if we actually got data in the responses
      if (!laborResponse || !laborResponse.data) {
        laborResponse = { data: [] };
      }
      
      if (!materialResponse || !materialResponse.data) {
        materialResponse = { data: [] };
      }
      
      const laborCosts = laborResponse.data || [];
      const materialCosts = materialResponse.data || [];
      
      console.log(`getWeeklyCosts: Processing ${laborCosts.length} labor costs and ${materialCosts.length} material costs`);
      console.log('Labor costs sample:', laborCosts.slice(0, 2));
      console.log('Material costs sample:', materialCosts.slice(0, 2));
      
      // Group by job
      const jobCosts = {};
      
      // Process labor costs
      laborCosts.forEach(cost => {
        const jobId = cost.jobId;
        if (!jobCosts[jobId]) {
          jobCosts[jobId] = {
            id: jobId,
            jobNumber: cost.job?.jobNumber || '',
            title: cost.job?.title || '',
            laborCost: 0,
            materialCost: 0
          };
        }
        jobCosts[jobId].laborCost += parseFloat(cost.cost) || 0;
      });
      
      // Process material costs
      materialCosts.forEach(order => {
        const jobId = order.jobId;
        if (!jobCosts[jobId]) {
          jobCosts[jobId] = {
            id: jobId,
            jobNumber: order.job?.jobNumber || '',
            title: order.job?.title || '',
            laborCost: 0,
            materialCost: 0
          };
        }
        jobCosts[jobId].materialCost += parseFloat(order.cost) || 0;
      });
      
      return {
        success: true,
        data: Object.values(jobCosts),
        totals: {
          laborCost: laborCosts.reduce((sum, cost) => sum + (parseFloat(cost.cost) || 0), 0),
          materialCost: materialCosts.reduce((sum, order) => sum + (parseFloat(order.cost) || 0), 0),
          totalCost: laborCosts.reduce((sum, cost) => sum + (parseFloat(cost.cost) || 0), 0) + 
                     materialCosts.reduce((sum, order) => sum + (parseFloat(order.cost) || 0), 0)
        },
        period: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      };
    } catch (error) {
      console.error('Get Weekly Costs API Error:', error);
      throw error;
    }
  },
  
  getMonthlyCosts: async (year, month) => {
    try {
      // Calculate start and end dates for the month
      const yearInt = parseInt(year);
      const monthInt = parseInt(month);
      
      const startDate = new Date(yearInt, monthInt - 1, 1);
      const endDate = new Date(yearInt, monthInt, 0); // Last day of the month
      
      // Format dates as YYYY-MM-DD using local date methods to avoid timezone issues
      const formattedStartDate = startDate.getFullYear() + '-' + 
        String(startDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(startDate.getDate()).padStart(2, '0');
      
      const formattedEndDate = endDate.getFullYear() + '-' + 
        String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(endDate.getDate()).padStart(2, '0');
      
      console.log(`Dashboard getMonthlyCosts: ${year}-${month} => ${formattedStartDate} to ${formattedEndDate}`);
      
      // Fetch data for the date range
      const [laborResponse, materialResponse] = await Promise.all([
        dailyLaborCostAPI.getByDateRange(formattedStartDate, formattedEndDate),
        materialOrderAPI.getByDateRange(formattedStartDate, formattedEndDate)
      ]);
      
      // Process and combine the data
      const laborCosts = laborResponse.data || [];
      const materialCosts = materialResponse.data || [];
      
      // Group by job
      const jobCosts = {};
      
      // Process labor costs
      laborCosts.forEach(cost => {
        const jobId = cost.jobId;
        if (!jobCosts[jobId]) {
          jobCosts[jobId] = {
            id: jobId,
            jobNumber: cost.job?.jobNumber || '',
            title: cost.job?.title || '',
            laborCost: 0,
            materialCost: 0
          };
        }
        jobCosts[jobId].laborCost += parseFloat(cost.cost) || 0;
      });
      
      // Process material costs
      materialCosts.forEach(order => {
        const jobId = order.jobId;
        if (!jobCosts[jobId]) {
          jobCosts[jobId] = {
            id: jobId,
            jobNumber: order.job?.jobNumber || '',
            title: order.job?.title || '',
            laborCost: 0,
            materialCost: 0
          };
        }
        jobCosts[jobId].materialCost += parseFloat(order.cost) || 0;
      });
      
      return {
        success: true,
        data: Object.values(jobCosts),
        totals: {
          laborCost: laborCosts.reduce((sum, cost) => sum + (parseFloat(cost.cost) || 0), 0),
          materialCost: materialCosts.reduce((sum, order) => sum + (parseFloat(order.cost) || 0), 0),
          totalCost: laborCosts.reduce((sum, cost) => sum + (parseFloat(cost.cost) || 0), 0) + 
                     materialCosts.reduce((sum, order) => sum + (parseFloat(order.cost) || 0), 0)
        },
        period: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      };
    } catch (error) {
      console.error('Get Monthly Costs API Error:', error);
      throw error;
    }
  },
  
  getYearlyCosts: async (year) => {
    try {
      // Calculate start and end dates for the year
      const yearInt = parseInt(year);
      const startDate = new Date(yearInt, 0, 1); // January 1st
      const endDate = new Date(yearInt, 11, 31); // December 31st
      
      // Format dates as YYYY-MM-DD using local date methods to avoid timezone issues
      const formattedStartDate = startDate.getFullYear() + '-' + 
        String(startDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(startDate.getDate()).padStart(2, '0');
      
      const formattedEndDate = endDate.getFullYear() + '-' + 
        String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(endDate.getDate()).padStart(2, '0');
      
      console.log(`Dashboard getYearlyCosts: ${year} => ${formattedStartDate} to ${formattedEndDate}`);
      
      // Fetch data for the date range
      const [laborResponse, materialResponse] = await Promise.all([
        dailyLaborCostAPI.getByDateRange(formattedStartDate, formattedEndDate),
        materialOrderAPI.getByDateRange(formattedStartDate, formattedEndDate)
      ]);
      
      // Process and combine the data
      const laborCosts = laborResponse.data || [];
      const materialCosts = materialResponse.data || [];
      
      // Group by job
      const jobCosts = {};
      
      // Process labor costs
      laborCosts.forEach(cost => {
        const jobId = cost.jobId;
        if (!jobCosts[jobId]) {
          jobCosts[jobId] = {
            id: jobId,
            jobNumber: cost.job?.jobNumber || '',
            title: cost.job?.title || '',
            laborCost: 0,
            materialCost: 0
          };
        }
        jobCosts[jobId].laborCost += parseFloat(cost.cost) || 0;
      });
      
      // Process material costs
      materialCosts.forEach(order => {
        const jobId = order.jobId;
        if (!jobCosts[jobId]) {
          jobCosts[jobId] = {
            id: jobId,
            jobNumber: order.job?.jobNumber || '',
            title: order.job?.title || '',
            laborCost: 0,
            materialCost: 0
          };
        }
        jobCosts[jobId].materialCost += parseFloat(order.cost) || 0;
      });
      
      return {
        success: true,
        data: Object.values(jobCosts),
        totals: {
          laborCost: laborCosts.reduce((sum, cost) => sum + (parseFloat(cost.cost) || 0), 0),
          materialCost: materialCosts.reduce((sum, order) => sum + (parseFloat(order.cost) || 0), 0),
          totalCost: laborCosts.reduce((sum, cost) => sum + (parseFloat(cost.cost) || 0), 0) + 
                     materialCosts.reduce((sum, order) => sum + (parseFloat(order.cost) || 0), 0)
        },
        period: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      };
    } catch (error) {
      console.error('Get Yearly Costs API Error:', error);
      throw error;
    }
  },
  
  getTotalCosts: async () => {
    try {
      // Fetch all data
      const [laborResponse, materialResponse] = await Promise.all([
        dailyLaborCostAPI.getAll(),
        materialOrderAPI.getAll()
      ]);
      
      // Process and combine the data
      const laborCosts = laborResponse.data || [];
      const materialCosts = materialResponse.data || [];
      
      // Group by job
      const jobCosts = {};
      
      // Process labor costs
      laborCosts.forEach(cost => {
        const jobId = cost.jobId;
        if (!jobCosts[jobId]) {
          jobCosts[jobId] = {
            id: jobId,
            jobNumber: cost.job?.jobNumber || '',
            title: cost.job?.title || '',
            laborCost: 0,
            materialCost: 0
          };
        }
        jobCosts[jobId].laborCost += parseFloat(cost.cost) || 0;
      });
      
      // Process material costs
      materialCosts.forEach(order => {
        const jobId = order.jobId;
        if (!jobCosts[jobId]) {
          jobCosts[jobId] = {
            id: jobId,
            jobNumber: order.job?.jobNumber || '',
            title: order.job?.title || '',
            laborCost: 0,
            materialCost: 0
          };
        }
        jobCosts[jobId].materialCost += parseFloat(order.cost) || 0;
      });
      
      return {
        success: true,
        data: Object.values(jobCosts),
        totals: {
          laborCost: laborCosts.reduce((sum, cost) => sum + (parseFloat(cost.cost) || 0), 0),
          materialCost: materialCosts.reduce((sum, order) => sum + (parseFloat(order.cost) || 0), 0),
          totalCost: laborCosts.reduce((sum, cost) => sum + (parseFloat(cost.cost) || 0), 0) + 
                     materialCosts.reduce((sum, order) => sum + (parseFloat(order.cost) || 0), 0)
        }
      };
    } catch (error) {
      console.error('Get Total Costs API Error:', error);
      throw error;
    }
  },
  
  getSummary: async (period = 'daily', date = null, startDate = null, endDate = null) => {
    try {
      let response;
      console.log(`Getting summary for period: ${period}, date: ${date}`);
      
      switch (period) {
        case 'daily':
          response = await dashboardAPI.getDailyCosts(date);
          break;
        case 'weekly':
          // Extract year and week from ISO week string (e.g., "2025-W27")
          if (date) {
            // Handle both "2025-W27" and "2025-27" formats
            let year, week;
            if (date.includes('-W')) {
              [year, week] = date.split('-W');
            } else {
              [year, week] = date.split('-');
            }
            console.log(`Parsed weekly date: year=${year}, week=${week}`);
            response = await dashboardAPI.getWeeklyCosts(year, week);
          } else {
            // Default to current week if not specified
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentWeek = Math.ceil((now - new Date(currentYear, 0, 1) + 86400000) / 604800000);
            console.log(`Using default current week: year=${currentYear}, week=${currentWeek}`);
            response = await dashboardAPI.getWeeklyCosts(currentYear.toString(), currentWeek.toString());
          }
          break;
        case 'monthly':
          // Extract year and month from "YYYY-MM" format
          if (date) {
            const [year, month] = date.split('-');
            console.log(`Parsed monthly date: year=${year}, month=${month}`);
            response = await dashboardAPI.getMonthlyCosts(year, month);
          } else {
            // Default to current month if not specified
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
            console.log(`Using default current month: year=${currentYear}, month=${currentMonth}`);
            response = await dashboardAPI.getMonthlyCosts(
              currentYear.toString(), 
              currentMonth.toString().padStart(2, '0')
            );
          }
          break;
        case 'total':
          response = await dashboardAPI.getTotalCosts();
          break;
        default:
          throw new Error('Invalid period specified');
      }
      
      return response;
    } catch (error) {
      console.error('Get Summary API Error:', error);
      throw error;
    }
  }
};
