import { Router } from 'express';
import { requireAuth, requireInstructor } from '../middleware/currentUser.js';
import {
  submitAssignment,
  getSubmissions,
  getUserSubmission,
  gradeSubmission,
} from '../controllers/AssignmentController.js';

const router = Router();

router.post('/:assignmentId/submit', requireAuth, submitAssignment);
router.get('/:assignmentId/submissions', requireInstructor, getSubmissions);
router.get('/:assignmentId/my-submission', requireAuth, getUserSubmission);
router.post('/:assignmentId/submissions/:submissionId/grade', requireInstructor, gradeSubmission);

export default router;
