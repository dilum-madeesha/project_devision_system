import { Router } from 'express';
import DailyJobCostController from '../controllers/dailyJobCostController.js';
import { authenticate, hasPermission } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create new daily job cost
router.post('/', DailyJobCostController.create);

// Update daily job cost
router.put('/:id', DailyJobCostController.update);

// Get all daily job costs
router.get('/', DailyJobCostController.getAll);

// Get daily job cost by ID
router.get('/:id', DailyJobCostController.getById);

// Delete daily job cost
router.delete('/:id', DailyJobCostController.delete);

// Get daily job costs by job ID
router.get('/job/:jobId', DailyJobCostController.getByJobId);

// Calculate job cost for a specific job and date
router.post('/calculate/:jobId/:date', DailyJobCostController.calculateForJob);

// Refresh costs from related tables for a specific job and date
router.post('/refresh/:jobId/:date', DailyJobCostController.refreshCosts);

export default router;
