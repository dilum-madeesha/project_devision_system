import { Router } from 'express';
import DailyLaborCostController from '../controllers/dailyLaborCostController.js';
import { authenticate, requirePrivilege, BACKEND_FEATURES } from '../middleware/privilegeAuth.js';

const router = Router();

// Create new daily labor cost
router.post('/', authenticate, requirePrivilege(BACKEND_FEATURES.ADD_LABOR_COST_CREATE), DailyLaborCostController.create);

// Update daily labor cost
router.put('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.ADD_LABOR_COST_UPDATE), DailyLaborCostController.update);

// Delete daily labor cost
router.delete('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.ADD_LABOR_COST_DELETE), DailyLaborCostController.delete);

// Get all daily labor costs
router.get('/', authenticate, DailyLaborCostController.getAll);

// Get daily labor costs by date range
router.get('/range', authenticate, DailyLaborCostController.getByDateRange);

// Get daily labor costs by date
router.get('/date/:date', authenticate, DailyLaborCostController.getByDate);

// Get daily labor costs by job ID
router.get('/job/:jobId', authenticate, DailyLaborCostController.getByJobId);

// Get daily labor cost by ID (IMPORTANT: This must come after other specific routes)
router.get('/:id', authenticate, DailyLaborCostController.getById);


export default router;
