// Main API exports - Central point for all API functions
export { default as api } from './config.js';

// Authentication & User Management
export { authAPI } from './auth.js';
export { userAPI } from './users.js';

// Core Business Data
export { jobAPI } from './jobs.js';
export { laborAPI } from './labor.js';
export { materialAPI } from './materials.js';

// Daily Operations
export { dailyLaborCostAPI } from './dailyLaborCosts.js';
export { dailyLaborAssignmentAPI } from './dailyLaborAssignments.js';
export { dailyJobCostAPI } from './dailyJobCosts.js';

// Material Operations
export { materialOrderAPI } from './materialOrders.js';
export { materialOrderAssignmentAPI } from './materialOrderAssignments.js';

// Reports
export { reportsAPI } from './reports.js';

// Dashboard & Analytics
export { dashboardAPI } from './dashboard.js';

// Utilities
export { apiHelpers, apiErrorUtils } from './utils.js';

export { agreementAPI } from './agreements.js';
export { contractorAPI } from './contractors.js';
export { officerAPI } from './officers.js';
export { projectAPI } from './projects.js';
