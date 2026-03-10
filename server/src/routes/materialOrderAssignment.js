import express from 'express';
import MaterialOrderAssignmentController from '../controllers/materialOrderAssignmentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create multiple material order assignments
router.post(
  '/create-multiple',
  MaterialOrderAssignmentController.createMultiple
);

// Get assignments by material order ID
router.get(
  '/material-order/:materialOrderId',
  MaterialOrderAssignmentController.getByMaterialOrderId
);

// Get assignments by job and date
router.get(
  '/job-date',
  MaterialOrderAssignmentController.getByJobAndDate
);

// Get assignments by material ID
router.get(
  '/material/:materialId',
  MaterialOrderAssignmentController.getByMaterialId
);

// Get assignment by ID
router.get(
  '/:id',
  MaterialOrderAssignmentController.getById
);

// Update assignment
router.put(
  '/:id',
  MaterialOrderAssignmentController.updateById
);

// Delete assignment
router.delete(
  '/:id',
  MaterialOrderAssignmentController.deleteById
);

// Get summary for a material order
router.get(
  '/summary/material-order/:materialOrderId',
  MaterialOrderAssignmentController.getSummaryByMaterialOrderId
);

export default router;
