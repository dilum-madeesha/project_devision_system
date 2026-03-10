// Privilege-based authorization middleware for backend
import { verifyToken } from '../utils/auth.js';

// Privilege levels – lower number means higher authority.  Only login
// checks are left completely open; an account with any valid
// credentials (isActive=true) can obtain a token.  The numeric value is
// used by the permission matrix throughout the API.
export const PRIVILEGE_LEVELS = {
  SYSTEM_ADMIN: 1,           // L1 - System Admin: everything
  OPERATION_VIEWER: 2,       // L2 - Operation Viewer: read‑only
  OPERATION_MANAGER: 3,      // L3 - Operation Manager: manage operations (register/data)
  REGISTRATION_MANAGER: 4,   // L4 - Registration Manager: create/update master data
  JOB_COST_MANAGER: 5,       // L5 - Job Cost Manager: handle both cost categories
  LABOR_COST_MANAGER: 6,     // L6 - Labor Cost Manager: labor cost only
  MATERIAL_COST_MANAGER: 7,  // L7 - Material Cost Manager: material cost only
};

// Feature definitions for backend
export const BACKEND_FEATURES = {
  // Dashboard API features
  DASHBOARD_VIEW: 'dashboard_view',
  
  // Register API features
  REGISTER_USERS_CREATE: 'register_users_create',
  REGISTER_USERS_READ: 'register_users_read',
  REGISTER_USERS_UPDATE: 'register_users_update',
  REGISTER_USERS_DELETE: 'register_users_delete',
  REGISTER_JOBS_CREATE: 'register_jobs_create',
  REGISTER_JOBS_READ: 'register_jobs_read',
  REGISTER_JOBS_UPDATE: 'register_jobs_update',
  REGISTER_JOBS_DELETE: 'register_jobs_delete',
  REGISTER_LABOR_CREATE: 'register_labor_create',
  REGISTER_LABOR_READ: 'register_labor_read',
  REGISTER_LABOR_UPDATE: 'register_labor_update',
  REGISTER_LABOR_DELETE: 'register_labor_delete',
  REGISTER_MATERIALS_CREATE: 'register_materials_create',
  REGISTER_MATERIALS_READ: 'register_materials_read',
  REGISTER_MATERIALS_UPDATE: 'register_materials_update',
  REGISTER_MATERIALS_DELETE: 'register_materials_delete',
  
  // Contractor API features
  REGISTER_CONTRACTOR_CREATE: 'register_contractor_create',
  REGISTER_CONTRACTOR_READ: 'register_contractor_read',
  REGISTER_CONTRACTOR_UPDATE: 'register_contractor_update',
  REGISTER_CONTRACTOR_DELETE: 'register_contractor_delete',
  
  // Officer API features
  REGISTER_OFFICER_CREATE: 'register_officer_create',
  REGISTER_OFFICER_READ: 'register_officer_read',
  REGISTER_OFFICER_UPDATE: 'register_officer_update',
  REGISTER_OFFICER_DELETE: 'register_officer_delete',
  
  // Agreement API features
  REGISTER_AGREEMENT_CREATE: 'register_agreement_create',
  REGISTER_AGREEMENT_READ: 'register_agreement_read',
  REGISTER_AGREEMENT_UPDATE: 'register_agreement_update',
  REGISTER_AGREEMENT_DELETE: 'register_agreement_delete',
  
  // Project API features
  PROJECT_CREATE: 'project_create',
  PROJECT_READ: 'project_read',
  PROJECT_UPDATE: 'project_update',
  PROJECT_DELETE: 'project_delete',
  
  // Add Cost API features
  ADD_LABOR_COST_CREATE: 'add_labor_cost_create',
  ADD_LABOR_COST_UPDATE: 'add_labor_cost_update',
  ADD_LABOR_COST_DELETE: 'add_labor_cost_delete',
  ADD_MATERIAL_COST_CREATE: 'add_material_cost_create',
  ADD_MATERIAL_COST_UPDATE: 'add_material_cost_update',
  ADD_MATERIAL_COST_DELETE: 'add_material_cost_delete',
  
  // Reports API features
  REPORTS_VIEW_ALL: 'reports_view_all',
  REPORTS_LABOR: 'reports_labor',
  REPORTS_LABOR_DISTRIBUTION: 'reports_labor_distribution',
  REPORTS_MATERIAL: 'reports_material',
  REPORTS_JOB_TOTAL_COST: 'reports_job_total_cost',
};

// Backend permission matrix
export const BACKEND_PERMISSION_MATRIX = {
  [PRIVILEGE_LEVELS.SYSTEM_ADMIN]: [
    // L1 - System Admin: All access
    ...Object.values(BACKEND_FEATURES)
  ],
  
  [PRIVILEGE_LEVELS.OPERATION_VIEWER]: [
    // L2 - Operation Viewer: View dashboards and reports only
    BACKEND_FEATURES.DASHBOARD_VIEW,
    BACKEND_FEATURES.REPORTS_VIEW_ALL,
    BACKEND_FEATURES.REPORTS_LABOR,
    BACKEND_FEATURES.REPORTS_LABOR_DISTRIBUTION,
    BACKEND_FEATURES.REPORTS_MATERIAL,
    BACKEND_FEATURES.REPORTS_JOB_TOTAL_COST,
    BACKEND_FEATURES.REGISTER_JOBS_READ,
    BACKEND_FEATURES.REGISTER_LABOR_READ,
    BACKEND_FEATURES.REGISTER_MATERIALS_READ,
    BACKEND_FEATURES.REGISTER_CONTRACTOR_READ,
    BACKEND_FEATURES.REGISTER_OFFICER_READ,
    BACKEND_FEATURES.REGISTER_AGREEMENT_READ,
    BACKEND_FEATURES.PROJECT_READ,
    
  ],
  
  [PRIVILEGE_LEVELS.OPERATION_MANAGER]: [
    // L3 - Operation Manager: All register, dashboard, reports - no add cost actions
    BACKEND_FEATURES.DASHBOARD_VIEW,
    BACKEND_FEATURES.REGISTER_USERS_CREATE,
    BACKEND_FEATURES.REGISTER_USERS_READ,
    BACKEND_FEATURES.REGISTER_USERS_UPDATE,
    BACKEND_FEATURES.REGISTER_USERS_DELETE,
    BACKEND_FEATURES.REGISTER_JOBS_CREATE,
    BACKEND_FEATURES.REGISTER_JOBS_READ,
    BACKEND_FEATURES.REGISTER_JOBS_UPDATE,
    BACKEND_FEATURES.REGISTER_JOBS_DELETE,
    BACKEND_FEATURES.REGISTER_LABOR_CREATE,
    BACKEND_FEATURES.REGISTER_LABOR_READ,
    BACKEND_FEATURES.REGISTER_LABOR_UPDATE,
    BACKEND_FEATURES.REGISTER_LABOR_DELETE,
    BACKEND_FEATURES.REGISTER_MATERIALS_CREATE,
    BACKEND_FEATURES.REGISTER_MATERIALS_READ,
    BACKEND_FEATURES.REGISTER_MATERIALS_UPDATE,
    BACKEND_FEATURES.REGISTER_MATERIALS_DELETE,
    BACKEND_FEATURES.REGISTER_CONTRACTOR_CREATE,
    BACKEND_FEATURES.REGISTER_CONTRACTOR_READ,
    BACKEND_FEATURES.REGISTER_CONTRACTOR_UPDATE,
    BACKEND_FEATURES.REGISTER_CONTRACTOR_DELETE,
    BACKEND_FEATURES.REGISTER_OFFICER_CREATE,
    BACKEND_FEATURES.REGISTER_OFFICER_READ,
    BACKEND_FEATURES.REGISTER_OFFICER_UPDATE,
    BACKEND_FEATURES.REGISTER_OFFICER_DELETE,
    BACKEND_FEATURES.REGISTER_AGREEMENT_CREATE,
    BACKEND_FEATURES.REGISTER_AGREEMENT_READ,
    BACKEND_FEATURES.REGISTER_AGREEMENT_UPDATE,
    BACKEND_FEATURES.REGISTER_AGREEMENT_DELETE,
    BACKEND_FEATURES.PROJECT_CREATE,
    BACKEND_FEATURES.PROJECT_READ,
    BACKEND_FEATURES.PROJECT_UPDATE,
    BACKEND_FEATURES.PROJECT_DELETE,
    BACKEND_FEATURES.REPORTS_VIEW_ALL,
    BACKEND_FEATURES.REPORTS_LABOR,
    BACKEND_FEATURES.REPORTS_LABOR_DISTRIBUTION,
    BACKEND_FEATURES.REPORTS_MATERIAL,
    BACKEND_FEATURES.REPORTS_JOB_TOTAL_COST,
  ],
  
  [PRIVILEGE_LEVELS.REGISTRATION_MANAGER]: [
    // L4 - Registration Manager: Job, labor and material register operations only
    BACKEND_FEATURES.REGISTER_JOBS_CREATE,
    BACKEND_FEATURES.REGISTER_JOBS_READ,
    BACKEND_FEATURES.REGISTER_JOBS_UPDATE,
    BACKEND_FEATURES.REGISTER_JOBS_DELETE,
    BACKEND_FEATURES.REGISTER_LABOR_CREATE,
    BACKEND_FEATURES.REGISTER_LABOR_READ,
    BACKEND_FEATURES.REGISTER_LABOR_UPDATE,
    BACKEND_FEATURES.REGISTER_LABOR_DELETE,
    BACKEND_FEATURES.REGISTER_MATERIALS_CREATE,
    BACKEND_FEATURES.REGISTER_MATERIALS_READ,
    BACKEND_FEATURES.REGISTER_MATERIALS_UPDATE,
    BACKEND_FEATURES.REGISTER_MATERIALS_DELETE,
    BACKEND_FEATURES.REGISTER_CONTRACTOR_CREATE,
    BACKEND_FEATURES.REGISTER_CONTRACTOR_READ,
    BACKEND_FEATURES.REGISTER_CONTRACTOR_UPDATE,
    BACKEND_FEATURES.REGISTER_CONTRACTOR_DELETE,
    BACKEND_FEATURES.REGISTER_OFFICER_CREATE,
    BACKEND_FEATURES.REGISTER_OFFICER_READ,
    BACKEND_FEATURES.REGISTER_OFFICER_UPDATE,
    BACKEND_FEATURES.REGISTER_OFFICER_DELETE,
    BACKEND_FEATURES.REGISTER_AGREEMENT_CREATE,
    BACKEND_FEATURES.REGISTER_AGREEMENT_READ,
    BACKEND_FEATURES.REGISTER_AGREEMENT_UPDATE,
    BACKEND_FEATURES.REGISTER_AGREEMENT_DELETE,
    BACKEND_FEATURES.PROJECT_CREATE,
    BACKEND_FEATURES.PROJECT_READ,
    BACKEND_FEATURES.PROJECT_UPDATE,
    BACKEND_FEATURES.PROJECT_DELETE,
    // Note: No access to user registration, dashboard, reports, or add cost operations
  ],
  
  [PRIVILEGE_LEVELS.JOB_COST_MANAGER]: [
    // L5 - Job Cost Manager: Add cost (all), register (labor & materials only), limited reports
    BACKEND_FEATURES.ADD_LABOR_COST_CREATE,
    BACKEND_FEATURES.ADD_LABOR_COST_UPDATE,
    BACKEND_FEATURES.ADD_LABOR_COST_DELETE,
    BACKEND_FEATURES.ADD_MATERIAL_COST_CREATE,
    BACKEND_FEATURES.ADD_MATERIAL_COST_UPDATE,
    BACKEND_FEATURES.ADD_MATERIAL_COST_DELETE,
    BACKEND_FEATURES.REGISTER_JOBS_READ,
    BACKEND_FEATURES.REGISTER_LABOR_CREATE,
    BACKEND_FEATURES.REGISTER_LABOR_READ,
    BACKEND_FEATURES.REGISTER_LABOR_UPDATE,
    BACKEND_FEATURES.REGISTER_LABOR_DELETE,
    BACKEND_FEATURES.REGISTER_MATERIALS_CREATE,
    BACKEND_FEATURES.REGISTER_MATERIALS_READ,
    BACKEND_FEATURES.REGISTER_MATERIALS_UPDATE,
    BACKEND_FEATURES.REGISTER_MATERIALS_DELETE,
    BACKEND_FEATURES.REPORTS_LABOR,
    BACKEND_FEATURES.REPORTS_LABOR_DISTRIBUTION,
    BACKEND_FEATURES.REPORTS_JOB_TOTAL_COST,
  ],
  
  [PRIVILEGE_LEVELS.LABOR_COST_MANAGER]: [
    // L6 - Labor Cost Manager: Only labor cost operations
    BACKEND_FEATURES.ADD_LABOR_COST_CREATE,
    BACKEND_FEATURES.ADD_LABOR_COST_UPDATE,
    BACKEND_FEATURES.ADD_LABOR_COST_DELETE,
    BACKEND_FEATURES.REGISTER_JOBS_READ,
    BACKEND_FEATURES.REGISTER_LABOR_READ,
  ],
  
  [PRIVILEGE_LEVELS.MATERIAL_COST_MANAGER]: [
    // L7 - Material Cost Manager: Material cost + material register
    BACKEND_FEATURES.ADD_MATERIAL_COST_CREATE,
    BACKEND_FEATURES.ADD_MATERIAL_COST_UPDATE,
    BACKEND_FEATURES.ADD_MATERIAL_COST_DELETE,
    BACKEND_FEATURES.REGISTER_MATERIALS_CREATE,
    BACKEND_FEATURES.REGISTER_MATERIALS_UPDATE,
    BACKEND_FEATURES.REGISTER_MATERIALS_DELETE,
    BACKEND_FEATURES.REGISTER_JOBS_READ,
    BACKEND_FEATURES.REGISTER_MATERIALS_READ,
  ],
};

// Check if user has specific privilege
export const hasPrivilege = (userPrivilege, feature) => {
  if (!userPrivilege || !feature) return false;
  
  const permissions = BACKEND_PERMISSION_MATRIX[userPrivilege];
  return permissions ? permissions.includes(feature) : false;
};

// Authentication middleware (existing - enhanced with privilege)
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Add user info to request including privilege
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Privilege-based authorization middleware
export const requirePrivilege = (requiredFeature) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userPrivilege = req.user.privilege;
    
    if (!hasPrivilege(userPrivilege, requiredFeature)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges',
        required: requiredFeature,
        current: `L${userPrivilege}`
      });
    }

    next();
  };
};

// Multiple features authorization (user needs ANY of the features)
export const requireAnyPrivilege = (requiredFeatures) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userPrivilege = req.user.privilege;
    const hasAnyPermission = requiredFeatures.some(feature => 
      hasPrivilege(userPrivilege, feature)
    );
    
    if (!hasAnyPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges',
        required: requiredFeatures,
        current: `L${userPrivilege}`
      });
    }

    next();
  };
};

// Multiple features authorization (user needs ALL of the features)
export const requireAllPrivileges = (requiredFeatures) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userPrivilege = req.user.privilege;
    const hasAllPermissions = requiredFeatures.every(feature => 
      hasPrivilege(userPrivilege, feature)
    );
    
    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges',
        required: requiredFeatures,
        current: `L${userPrivilege}`
      });
    }

    next();
  };
};

// Helper middleware for System Admin only access
export const requireSystemAdmin = requirePrivilege('system_admin_all');

// Simplified privilege level checks
export const requireMinimumPrivilege = (minLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userPrivilege = req.user.privilege;
    
    // For System Admin (L1), allow all
    if (userPrivilege === PRIVILEGE_LEVELS.SYSTEM_ADMIN) {
      return next();
    }
    
    // Check if user meets minimum privilege requirement
    if (userPrivilege > minLevel) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges',
        required: `L${minLevel} or higher`,
        current: `L${userPrivilege}`
      });
    }

    next();
  };
};

export default {
  authenticate,
  requirePrivilege,
  requireAnyPrivilege,
  requireAllPrivileges,
  requireSystemAdmin,
  requireMinimumPrivilege,
  hasPrivilege,
  PRIVILEGE_LEVELS,
  BACKEND_FEATURES,
  BACKEND_PERMISSION_MATRIX
};
