import { Router } from 'express';
import LaborController from '../controllers/laborController.js';
import { authenticate, requirePrivilege, BACKEND_FEATURES } from '../middleware/privilegeAuth.js';

const router = Router();

router.post('/', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_LABOR_CREATE), LaborController.register);
router.put('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_LABOR_UPDATE), LaborController.update);
router.delete('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_LABOR_DELETE), LaborController.deleteLabor);

router.get('/', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_LABOR_READ), LaborController.getAllLabors);
router.get('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_LABOR_READ), LaborController.getLaborById);

export default router;
