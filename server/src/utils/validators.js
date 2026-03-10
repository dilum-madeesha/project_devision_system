import validator from 'validator';
const { isEmail } = validator;

class Validators {
  static validateRegistration(data) {
    const errors = {};

    // Username validation
    if (!data.username || data.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!data.email || !isEmail(data.email)) {
      errors.email = 'Please provide a valid email address';
    }

    // Password validation
    if (!data.password || data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Name validation
    if (!data.firstName || data.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters long';
    }

    if (!data.lastName || data.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters long';
    }

    // Role validation
    const validRoles = [
      'ADMIN', 'MANAGER', 'SUPERVISOR', 'WORKER',
      'HEAD', 'DEPUTY_HEAD', 'PROJECT_MANAGER', 'CHIEF_ENGINEER',
      'ENGINEER', 'ASSISTANT_ENGINEER', 'TECHNICAL_OFFICER',
      'SECRETARY', 'TRAINEE', 'OTHER'
    ];
    if (data.role && !validRoles.includes(data.role)) {
      errors.role = 'Invalid role specified';
    }

    // epfNumber validation
    if (typeof data.epfNumber !== 'number' || !Number.isInteger(data.epfNumber) || data.epfNumber < 1000 || data.epfNumber > 9999) {
      errors.epfNumber = 'EPF Number must be a unique 4-digit integer';
    }

    // division validation
    if (!data.division || typeof data.division !== 'string' || data.division.trim().length === 0) {
      errors.division = 'Division is required';
    }

    // privilege validation
    if (typeof data.privilege !== 'number' || !Number.isInteger(data.privilege)) {
      errors.privilege = 'Privilege must be an integer';
    } else if (data.privilege < 1 || data.privilege > 7) {
      errors.privilege = 'Privilege level must be between 1 (system admin) and 7 (material cost manager)';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateLogin(data) {
    const errors = {};

    if (!data.username && !data.email) {
      errors.identifier = 'Username or email is required';
    }

    if (!data.password) {
      errors.password = 'Password is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateJob(data) {
    const errors = {};

    // reqDepartment validation
    if (!data.reqDepartment || typeof data.reqDepartment !== 'string' || data.reqDepartment.trim().length === 0) {
      errors.reqDepartment = 'Requesting Department is required';
    }

    // reqDate validation
    if (!data.reqDate || isNaN(Date.parse(data.reqDate))) {
      errors.reqDate = 'A valid request date is required';
    }

    // projectCode validation
    if (!data.projectCode || typeof data.projectCode !== 'string' || data.projectCode.trim().length === 0) {
      errors.projectCode = 'Project code is required';
    }

    // budgetAllocation validation (optional field)
    if (data.budgetAllocation !== undefined && data.budgetAllocation !== null && data.budgetAllocation !== '') {
      const budgetValue = parseFloat(data.budgetAllocation);
      if (isNaN(budgetValue) || budgetValue < 0) {
        errors.budgetAllocation = 'Budget allocation must be a valid positive number';
      }
    }

    // assignOfficer validation
    if (!data.assignOfficer || typeof data.assignOfficer !== 'string' || data.assignOfficer.trim().length === 0) {
      errors.assignOfficer = 'Assign officer is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateLabor(data, isUpdate = false) {
    const errors = {};

    // EPF number validation
    if (typeof data.epfNumber !== 'number' || !Number.isInteger(data.epfNumber) || data.epfNumber < 1000 || data.epfNumber > 9999) {
      errors.epfNumber = 'EPF Number must be a 4-digit integer';
    }

    if (!data.firstName || data.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters long';
    }

    if (!data.lastName || data.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters long';
    }

    if (!data.division || typeof data.division !== 'string' || data.division.trim().length === 0) {
      errors.division = 'Division is required';
    }

    if (!data.trade || typeof data.trade !== 'string' || data.trade.trim().length === 0) {
      errors.trade = 'Trade is required';
    }

    if (!data.payGrade || typeof data.payGrade !== 'string' || data.payGrade.trim().length === 0) {
      errors.payGrade = 'Pay grade is required';
    }

    if (typeof data.dayPay !== 'number' || data.dayPay <= 0) {
      errors.dayPay = 'Day pay must be a positive number';
    }

    if (typeof data.otPay !== 'number' || data.otPay < 0) {
      errors.otPay = 'OT pay must be a non-negative number';
    }

    // Weekend pay validation - optional field, defaults to dayPay value if not provided
    if (data.weekendPay !== undefined && data.weekendPay !== null) {
      if (typeof data.weekendPay !== 'number' || data.weekendPay < 0) {
        errors.weekendPay = 'Weekend pay must be a non-negative number';
      }
    }

    // Only validate createdById for new records, not updates
    if (!isUpdate && (typeof data.createdById !== 'number' || !Number.isInteger(data.createdById))) {
      errors.createdById = 'createdById must be a valid user id';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateDailyLaborCost(data) {
    const errors = {};

    // jobId validation
    if (typeof data.jobId !== 'number' || !Number.isInteger(data.jobId)) {
      errors.jobId = 'Job ID must be a valid integer';
    }

    // date validation
    if (!data.date || isNaN(Date.parse(data.date))) {
      errors.date = 'A valid date is required';
    }

    // cost validation
    if (typeof data.cost !== 'number' || isNaN(data.cost) || data.cost < 0) {
      errors.cost = 'Cost must be a valid non-negative number';
    }

    // createdById validation
    if (typeof data.createdById !== 'number' || !Number.isInteger(data.createdById)) {
      errors.createdById = 'Created by ID must be a valid user ID';
    }

    // updatedById validation
    if (typeof data.updatedById !== 'number' || !Number.isInteger(data.updatedById)) {
      errors.updatedById = 'Updated by ID must be a valid user ID';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateMaterialOrder(data) {
    const errors = {};

    // jobId validation
    if (typeof data.jobId !== 'number' || !Number.isInteger(data.jobId)) {
      errors.jobId = 'Job ID must be a valid integer';
    }

    // date validation
    if (!data.date || isNaN(Date.parse(data.date))) {
      errors.date = 'A valid date is required';
    }

    // type validation
    const validTypes = ['MR', 'PR', 'PO', 'GRN', 'STORE', 'OTHER'];
    if (!data.type || !validTypes.includes(data.type)) {
      errors.type = 'Invalid material order type. Must be MR, PR, PO, GRN, STORE, or OTHER';
    }

    // code validation
    if (!data.code || typeof data.code !== 'string' || data.code.trim().length === 0) {
      errors.code = 'Material code is required';
    }

    // cost validation
    if (typeof data.cost !== 'number' || isNaN(data.cost) || data.cost < 0) {
      errors.cost = 'Cost must be a valid non-negative number';
    }

    // createdById validation
    if (typeof data.createdById !== 'number' || !Number.isInteger(data.createdById)) {
      errors.createdById = 'Created by ID must be a valid user ID';
    }

    // updatedById validation
    if (typeof data.updatedById !== 'number' || !Number.isInteger(data.updatedById)) {
      errors.updatedById = 'Updated by ID must be a valid user ID';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateDailyJobCost(data) {
    const errors = {};

    // jobId validation
    if (typeof data.jobId !== 'number' || !Number.isInteger(data.jobId)) {
      errors.jobId = 'Job ID must be a valid integer';
    }

    // date validation
    if (!data.date || isNaN(Date.parse(data.date))) {
      errors.date = 'A valid date is required';
    }

    // laborCost validation (optional, will be auto-calculated if not provided)
    if (data.laborCost !== undefined && (typeof data.laborCost !== 'number' || isNaN(data.laborCost) || data.laborCost < 0)) {
      errors.laborCost = 'Labor cost must be a valid non-negative number';
    }

    // materialCost validation (optional, will be auto-calculated if not provided)
    if (data.materialCost !== undefined && (typeof data.materialCost !== 'number' || isNaN(data.materialCost) || data.materialCost < 0)) {
      errors.materialCost = 'Material cost must be a valid non-negative number';
    }

    // totalCost validation (optional, will be auto-calculated)
    if (data.totalCost !== undefined && (typeof data.totalCost !== 'number' || isNaN(data.totalCost) || data.totalCost < 0)) {
      errors.totalCost = 'Total cost must be a valid non-negative number';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateMaterial(data) {
    const errors = {};

    // Name validation
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.name = 'Material name is required';
    } else if (data.name.trim().length < 2) {
      errors.name = 'Material name must be at least 2 characters long';
    }

    // UOM (Unit of Measurement) validation
    if (!data.uom || typeof data.uom !== 'string' || data.uom.trim().length === 0) {
      errors.uom = 'Unit of measurement is required';
    }

    // Unit Price validation (optional)
    if (data.unitPrice !== undefined && data.unitPrice !== null && data.unitPrice !== '') {
      const price = parseFloat(data.unitPrice);
      if (isNaN(price) || price < 0) {
        errors.unitPrice = 'Unit price must be a valid non-negative number';
      }
    }

    // Description validation (optional, but if provided should have minimum length)
    if (data.description && typeof data.description === 'string' && data.description.trim().length > 0) {
      if (data.description.trim().length < 3) {
        errors.description = 'Description must be at least 3 characters long if provided';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

   static validateAgreement(data, isUpdate = false) {
    const errors = {};

    // agreementNumber validation (required for new, optional for update)
    if (!isUpdate && (!data.agreementNumber || typeof data.agreementNumber !== 'string' || data.agreementNumber.trim().length === 0)) {
      errors.agreementNumber = 'Agreement number is required';
    }

    // title / name validation
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
      errors.title = 'Agreement title must be at least 3 characters long';
    }

    // contractor validation
    if (!data.contractorName || typeof data.contractorName !== 'string' || data.contractorName.trim().length < 3) {
      errors.contractorName = 'Contractor name must be at least 3 characters long';
    }

    // status validation
    const validStatuses = ['Pending', 'Active', 'Completed', 'Cancelled'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.status = 'Invalid status provided';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export const validateRegistration = Validators.validateRegistration;
export const validateLogin = Validators.validateLogin;
export const validateJob = Validators.validateJob;
export const validateLabor = Validators.validateLabor;
export const validateMaterial = Validators.validateMaterial;
export const validateDailyLaborCost = Validators.validateDailyLaborCost;
export const validateMaterialOrder = Validators.validateMaterialOrder;
export const validateDailyJobCost = Validators.validateDailyJobCost;
export const validateAgreement = Validators.validateAgreement;
