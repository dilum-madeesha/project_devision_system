import { Router } from 'express';
import OfficerController from '../controllers/officerController.js';
import { authenticate, requirePrivilege, BACKEND_FEATURES } from '../middleware/privilegeAuth.js';

const router = Router();

// Create new officer
router.post('/', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_OFFICER_CREATE), OfficerController.create);

// Update officer by ID
router.put('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_OFFICER_UPDATE), OfficerController.update);

// Delete officer by ID
router.delete('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_OFFICER_DELETE), OfficerController.delete);

// Get all officers
router.get('/', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_OFFICER_READ), OfficerController.getAll);

// Get officer by ID
router.get('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_OFFICER_READ), OfficerController.getById);

export default router;
