import { Router } from 'express';
import { requireAuth, requireInstructor } from '../middleware/currentUser.js';
import { createReply, toggleFeatured, togglePinned } from '../controllers/DiscussionController.js';

const router = Router();

router.post('/:postId/reply', requireAuth, createReply);
router.put('/:postId/feature', requireInstructor, toggleFeatured);
router.put('/:postId/pin', requireInstructor, togglePinned);

export default router;
