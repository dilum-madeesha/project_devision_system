import express from 'express';
import DailyLaborAssignmentController from '../controllers/dailyLaborAssignmentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get assignments for a date range (put before :id route)
router.get('/date-range', DailyLaborAssignmentController.getByDateRange);

// Get assignments for a specific daily labor cost
router.get('/daily-labor-cost/:dailyLaborCostId', DailyLaborAssignmentController.getByDailyLaborCostId);

// Get assignment by ID
router.get('/:id', DailyLaborAssignmentController.getById);

// Update assignment by ID
router.put('/:id', DailyLaborAssignmentController.updateById);

// Get assignments for a specific labor
router.get('/labor/:laborId', DailyLaborAssignmentController.getByLaborId);

// Get labor work summary
router.get('/labor/:laborId/summary', DailyLaborAssignmentController.getLaborWorkSummary);

// Get assignments for a specific job
router.get('/job/:jobId', DailyLaborAssignmentController.getByJobId);

// Get assignments for a date range
router.get('/date-range', DailyLaborAssignmentController.getByDateRange);
// Get assignment by ID (put after specific routes)
router.get('/:id', DailyLaborAssignmentController.getById);

// Get labor work summary
router.get('/labor/:laborId/summary', DailyLaborAssignmentController.getLaborWorkSummary);
// Update assignment by ID
router.put('/:id', DailyLaborAssignmentController.updateById);

export default router;
