import { Router } from 'express';
import { requireInstructor } from '../middleware/currentUser.js';
import {
  getStats,
  getDailyEnrollments,
  getLessonCompletion,
  getStudyTimeDistribution,
} from '../controllers/DashboardController.js';

const router = Router();

router.get('/', requireInstructor, getStats);
router.get('/daily-enrollments', requireInstructor, getDailyEnrollments);
router.get('/lesson-completion', requireInstructor, getLessonCompletion);
router.get('/study-time-distribution', requireInstructor, getStudyTimeDistribution);

export default router;
