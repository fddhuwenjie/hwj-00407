import { Router } from 'express';
import { requireAuth } from '../middleware/currentUser.js';
import { markComplete, getQuiz, submitQuiz } from '../controllers/LessonController.js';

const router = Router();

router.post('/:id/complete', requireAuth, markComplete);
router.get('/:id/quiz', requireAuth, getQuiz);
router.post('/:id/quiz/submit', requireAuth, submitQuiz);

export default router;
