import { Router } from 'express';
import { requireAuth, requireInstructor } from '../middleware/currentUser.js';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  enrollCourse,
  getProgress,
} from '../controllers/CourseController.js';
import { getPosts, createPost } from '../controllers/DiscussionController.js';

const router = Router();

router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/', requireInstructor, createCourse);
router.post('/:id/enroll', requireAuth, enrollCourse);
router.get('/:id/progress', requireAuth, getProgress);
router.get('/:id/discussion', requireAuth, getPosts);
router.post('/:id/discussion', requireAuth, createPost);

export default router;
