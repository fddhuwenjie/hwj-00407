import { Router } from 'express';
import { requireAuth } from '../middleware/currentUser.js';
import { verifyCertificate, generateCertificate } from '../controllers/CertificateController.js';

const router = Router();

router.get('/:number/verify', verifyCertificate);
router.post('/generate', requireAuth, generateCertificate);

export default router;
