import { Router } from 'express';
import AgreementController from '../controllers/agreementController.js';
import { authenticate, requirePrivilege, BACKEND_FEATURES } from '../middleware/privilegeAuth.js';

const router = Router();

// Create new agreement
router.post('/', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_AGREEMENT_CREATE), AgreementController.register);

// Update agreement by ID
router.put('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_AGREEMENT_UPDATE), AgreementController.update
);

// Delete agreement by ID
router.delete('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_AGREEMENT_DELETE), AgreementController.deleteAgreement
);

// Get all agreements
router.get( '/', authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_AGREEMENT_READ), AgreementController.getAllAgreements );

// Get agreement by ID
router.get('/:id',authenticate, requirePrivilege(BACKEND_FEATURES.REGISTER_AGREEMENT_READ), AgreementController.getAgreementById );

export default router;
