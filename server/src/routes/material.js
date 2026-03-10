import { Router } from 'express';
const router = Router();
import MaterialController from '../controllers/materialController.js';
const { 
  createMaterial, 
  getAllMaterials, 
  getMaterialById, 
  updateMaterial, 
  deleteMaterial, 
  searchMaterials,
  bulkCreateMaterials 
} = MaterialController;
import { authenticate, requirePrivilege, BACKEND_FEATURES } from '../middleware/privilegeAuth.js';

// Material CRUD routes
router.post('/', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_MATERIALS_CREATE), createMaterial);
router.post('/bulk', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_MATERIALS_CREATE), bulkCreateMaterials); // Bulk upload route
router.put('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_MATERIALS_UPDATE), updateMaterial);
router.delete('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_MATERIALS_DELETE), deleteMaterial);

router.get('/', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_MATERIALS_READ), getAllMaterials);
router.get('/search', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_MATERIALS_READ), searchMaterials); // Must be before /:id route
router.get('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_MATERIALS_READ), getMaterialById);

export default router;
