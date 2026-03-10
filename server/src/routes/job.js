import { Router } from 'express';
import JobController from '../controllers/jobController.js';
import { authenticate, requirePrivilege, BACKEND_FEATURES } from '../middleware/privilegeAuth.js';

const router = Router();

router.post('/', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_JOBS_CREATE), JobController.createJob);
router.put('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_JOBS_UPDATE), JobController.updateJob);
router.delete('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_JOBS_DELETE), JobController.deleteJob);

router.get('/', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_JOBS_READ), JobController.getAllJobs);
router.get('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_JOBS_READ), JobController.getJobById);

export default router;
