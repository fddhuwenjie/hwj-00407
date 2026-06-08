import { Router } from 'express';
import { requireAuth, requireInstructor } from '../middleware/currentUser.js';
import { markComplete, getQuiz, submitQuiz } from '../controllers/LessonController.js';
import { getLessonNotes } from '../controllers/NoteController.js';
import { createAssignment, getAssignment } from '../controllers/AssignmentController.js';

const router = Router();

router.post('/:id/complete', requireAuth, markComplete);
router.get('/:id/quiz', requireAuth, getQuiz);
router.post('/:id/quiz/submit', requireAuth, submitQuiz);
router.get('/:id/notes', requireAuth, getLessonNotes);
router.post('/:id/assignment', requireInstructor, createAssignment);
router.get('/:id/assignment', requireAuth, getAssignment);

export default router;
