// Privilege levels
export const PRIVILEGE_LEVELS = {
  SYSTEM_ADMIN: 1,           // L1 - System Admin
  OPERATION_VIEWER: 2,       // L2 - Operation Viewer
  OPERATION_MANAGER: 3,      // L3 - Operation Manager
  REGISTRATION_MANAGER: 4,   // L4 - Registration Manager
  JOB_COST_MANAGER: 5,       // L5 - Job Cost Manager
  LABOR_COST_MANAGER: 6,     // L6 - Labor Cost Manager
  MATERIAL_COST_MANAGER: 7,  // L7 - Material Cost Manager
};

// Feature definitions
export const FEATURES = {
  // Dashboard features
  DASHBOARD_VIEW: 'dashboard_view',
  
  // Register features
  REGISTER_USERS: 'register_users',
  REGISTER_JOBS: 'register_jobs',
  REGISTER_LABOR: 'register_labor',
  REGISTER_MATERIALS: 'register_materials',
  REGISTER_ACCESS: 'register_access',
  
  // Add Cost features
  ADD_LABOR_COST: 'add_labor_cost',
  ADD_MATERIAL_COST: 'add_material_cost',
  ACCESS_ADD_COST_LABOR: 'access_add_cost_labor',
  ACCESS_ADD_COST_MATERIAL: 'access_add_cost_material',
  
  // Reports features
  REPORTS_ACCESS: 'reports_access',
  REPORTS_VIEW_ALL: 'reports_view_all',
  REPORTS_LABOR: 'reports_labor',
  REPORTS_LABOR_DISTRIBUTION: 'reports_labor_distribution',
  REPORTS_MATERIAL: 'reports_material',
  REPORTS_JOB_TOTAL_COST: 'reports_job_total_cost',
  
  // Action features
  ACTIONS_REGISTER: 'actions_register',
  ACTIONS_ADD_COST: 'actions_add_cost',
};

// Permission matrix - maps privilege levels to allowed features
export const PERMISSION_MATRIX = {
  [PRIVILEGE_LEVELS.SYSTEM_ADMIN]: [
    // L1 - System Admin: All access
    FEATURES.DASHBOARD_VIEW,
    FEATURES.REGISTER_USERS,
    FEATURES.REGISTER_JOBS,
    FEATURES.REGISTER_LABOR,
    FEATURES.REGISTER_MATERIALS,
    FEATURES.REGISTER_ACCESS,
    FEATURES.ADD_LABOR_COST,
    FEATURES.ADD_MATERIAL_COST,
    FEATURES.ACCESS_ADD_COST_LABOR,
    FEATURES.ACCESS_ADD_COST_MATERIAL,
    FEATURES.REPORTS_ACCESS,
    FEATURES.REPORTS_VIEW_ALL,
    FEATURES.REPORTS_LABOR,
    FEATURES.REPORTS_LABOR_DISTRIBUTION,
    FEATURES.REPORTS_MATERIAL,
    FEATURES.REPORTS_JOB_TOTAL_COST,
    FEATURES.ACTIONS_REGISTER,
    FEATURES.ACTIONS_ADD_COST,
  ],
  
  [PRIVILEGE_LEVELS.OPERATION_VIEWER]: [
    // L2 - Operation Viewer: View dashboards and reports only
    FEATURES.DASHBOARD_VIEW,
    FEATURES.REPORTS_ACCESS,
    FEATURES.REPORTS_VIEW_ALL,
    FEATURES.REPORTS_LABOR,
    FEATURES.REPORTS_LABOR_DISTRIBUTION,
    FEATURES.REPORTS_MATERIAL,
    FEATURES.REPORTS_JOB_TOTAL_COST,
    FEATURES.REGISTER_ACCESS,
    FEATURES.ACCESS_ADD_COST_LABOR,
    FEATURES.ACCESS_ADD_COST_MATERIAL,
    // Note: Can see register and add cost pages but cannot perform actions
  ],
  
  [PRIVILEGE_LEVELS.OPERATION_MANAGER]: [
    // L3 - Operation Manager: All register, dashboard, reports - no add cost actions
    FEATURES.DASHBOARD_VIEW,
    FEATURES.REGISTER_USERS,
    FEATURES.REGISTER_JOBS,
    FEATURES.REGISTER_LABOR,
    FEATURES.REGISTER_MATERIALS,
    FEATURES.REGISTER_ACCESS,
    FEATURES.ACCESS_ADD_COST_LABOR,
    FEATURES.ACCESS_ADD_COST_MATERIAL,
    FEATURES.REPORTS_ACCESS,
    FEATURES.REPORTS_VIEW_ALL,
    FEATURES.REPORTS_LABOR,
    FEATURES.REPORTS_LABOR_DISTRIBUTION,
    FEATURES.REPORTS_MATERIAL,
    FEATURES.REPORTS_JOB_TOTAL_COST,
    FEATURES.ACTIONS_REGISTER,
    // Note: Can see add cost pages but cannot perform add cost actions
  ],
  
  [PRIVILEGE_LEVELS.REGISTRATION_MANAGER]: [
    // L4 - Registration Manager: Job, labor and material register pages only
    FEATURES.REGISTER_JOBS,
    FEATURES.REGISTER_LABOR,
    FEATURES.REGISTER_MATERIALS,
    FEATURES.REGISTER_ACCESS,
    FEATURES.ACTIONS_REGISTER,
    // Note: No access to user registration, dashboard, reports, or add cost pages
  ],
  
  [PRIVILEGE_LEVELS.JOB_COST_MANAGER]: [
    // L5 - Job Cost Manager: Add cost (all), register (labor & materials only), limited reports only
    FEATURES.ADD_LABOR_COST,
    FEATURES.ADD_MATERIAL_COST,
    FEATURES.ACCESS_ADD_COST_LABOR,
    FEATURES.ACCESS_ADD_COST_MATERIAL,
    FEATURES.REGISTER_LABOR,
    FEATURES.REGISTER_MATERIALS,
    FEATURES.REGISTER_ACCESS,
    FEATURES.REPORTS_ACCESS,
    FEATURES.REPORTS_LABOR,
    FEATURES.REPORTS_LABOR_DISTRIBUTION,
    FEATURES.REPORTS_JOB_TOTAL_COST,
    FEATURES.ACTIONS_ADD_COST,
    FEATURES.ACTIONS_REGISTER, // Only for labor and materials
  ],
  
  [PRIVILEGE_LEVELS.LABOR_COST_MANAGER]: [
    // L6 - Labor Cost Manager: Only labor cost operations - no dashboard, reports, or registration
    FEATURES.ADD_LABOR_COST,
    FEATURES.ACCESS_ADD_COST_LABOR,
    FEATURES.ACTIONS_ADD_COST, // Only for labor cost
  ],
  
  [PRIVILEGE_LEVELS.MATERIAL_COST_MANAGER]: [
    // L7 - Material Cost Manager: Material cost + material register only - no dashboard or reports
    FEATURES.ADD_MATERIAL_COST,
    FEATURES.ACCESS_ADD_COST_MATERIAL,
    FEATURES.REGISTER_MATERIALS,
    FEATURES.REGISTER_ACCESS,
    FEATURES.ACTIONS_ADD_COST, // Only for material cost
    FEATURES.ACTIONS_REGISTER, // Only for materials
  ],
};

// Helper functions
export const hasPermission = (userPrivilege, feature) => {
  if (!userPrivilege || !feature) return false;
  
  const permissions = PERMISSION_MATRIX[userPrivilege];
  return permissions ? permissions.includes(feature) : false;
};

export const hasAnyPermission = (userPrivilege, features) => {
  if (!userPrivilege || !features || features.length === 0) return false;
  
  return features.some(feature => hasPermission(userPrivilege, feature));
};

export const hasAllPermissions = (userPrivilege, features) => {
  if (!userPrivilege || !features || features.length === 0) return false;
  
  return features.every(feature => hasPermission(userPrivilege, feature));
};

// Get privilege level name
export const getPrivilegeLevelName = (privilege) => {
  const names = {
    1: 'L1 - System Admin',
    2: 'L2 - Operation Viewer',
    3: 'L3 - Operation Manager',
    4: 'L4 - Registration Manager',
    5: 'L5 - Job Cost Manager',
    6: 'L6 - Labor Cost Manager',
    7: 'L7 - Material Cost Manager',
  };
  
  return names[privilege] || `L${privilege} - Unknown`;
};

// Check if user can access specific register sub-pages
export const canAccessRegisterPage = (userPrivilege, registerType) => {
  switch (registerType) {
    case 'users':
      return hasPermission(userPrivilege, FEATURES.REGISTER_USERS);
    case 'jobs':
      return hasPermission(userPrivilege, FEATURES.REGISTER_JOBS);
    case 'labors':
      return hasPermission(userPrivilege, FEATURES.REGISTER_LABOR);
    case 'materials':
      return hasPermission(userPrivilege, FEATURES.REGISTER_MATERIALS);
    default:
      return false;
  }
};

// Check if user can access specific add cost sub-pages
export const canAccessAddCostPage = (userPrivilege, costType) => {
  switch (costType) {
    case 'labor':
      return hasPermission(userPrivilege, FEATURES.ADD_LABOR_COST);
    case 'material':
      return hasPermission(userPrivilege, FEATURES.ADD_MATERIAL_COST);
    default:
      return false;
  }
};

// Check if user can access specific report pages
export const canAccessReportPage = (userPrivilege, reportType) => {
  switch (reportType) {
    case 'labor':
      return hasPermission(userPrivilege, FEATURES.REPORTS_LABOR);
    case 'labor_distribution':
      return hasPermission(userPrivilege, FEATURES.REPORTS_LABOR_DISTRIBUTION);
    case 'material':
      return hasPermission(userPrivilege, FEATURES.REPORTS_MATERIAL);
    case 'job_total_cost':
      return hasPermission(userPrivilege, FEATURES.REPORTS_JOB_TOTAL_COST);
    default:
      return hasPermission(userPrivilege, FEATURES.REPORTS_VIEW_ALL);
  }
};

export default {
  PRIVILEGE_LEVELS,
  FEATURES,
  PERMISSION_MATRIX,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPrivilegeLevelName,
  canAccessRegisterPage,
  canAccessAddCostPage,
  canAccessReportPage,
};
