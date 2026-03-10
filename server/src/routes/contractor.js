import { Router } from 'express';
import ContractorController from '../controllers/contractorsController.js';
import { authenticate, requirePrivilege, BACKEND_FEATURES } from '../middleware/privilegeAuth.js';

const router = Router();

// Create new contractor
router.post('/', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_CONTRACTOR_CREATE), ContractorController.create);

// Update contractor by ID
router.put('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_CONTRACTOR_UPDATE), ContractorController.update);

// Delete contractor by ID
router.delete('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_CONTRACTOR_DELETE), ContractorController.delete);

// Get all contractors
router.get('/', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_CONTRACTOR_READ), ContractorController.getAll);

// Get contractor by ID
router.get('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_CONTRACTOR_READ), ContractorController.getById);

export default router;
