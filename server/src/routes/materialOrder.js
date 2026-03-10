import { Router } from 'express';
import MaterialOrderController from '../controllers/materialOrderController.js';
import { authenticate, requirePrivilege, BACKEND_FEATURES } from '../middleware/privilegeAuth.js';

const router = Router();

// Create new material order
router.post('/', authenticate, requirePrivilege(BACKEND_FEATURES.ADD_MATERIAL_COST_CREATE), MaterialOrderController.create);

// Update material order
router.put('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.ADD_MATERIAL_COST_UPDATE), MaterialOrderController.update);

// Delete material order
router.delete('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.ADD_MATERIAL_COST_DELETE), MaterialOrderController.delete);

// Get all material orders
router.get('/', authenticate, MaterialOrderController.getAll);

// Get material orders by date range
router.get('/range', authenticate, MaterialOrderController.getByDateRange);

// Get material orders by date
router.get('/date/:date', authenticate, MaterialOrderController.getByDate);

// Get material orders by job ID
router.get('/job/:jobId', authenticate, MaterialOrderController.getByJobId);

// Get material order by ID (IMPORTANT: This must come after other specific routes)
router.get('/:id', authenticate, MaterialOrderController.getById);


export default router;
