import { Router } from 'express';
import { getAllUsers, getUserById } from '../controllers/UserController.js';
import { getUserCertificates } from '../controllers/CertificateController.js';

const router = Router();

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.get('/:id/certificates', getUserCertificates);

export default router;
