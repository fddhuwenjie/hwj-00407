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
import { getGroupsByCourse } from '../controllers/StudyGroupController.js';
import { getAssignmentStats } from '../controllers/AssignmentController.js';

const router = Router();

router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/', requireInstructor, createCourse);
router.post('/:id/enroll', requireAuth, enrollCourse);
router.get('/:id/progress', requireAuth, getProgress);
router.get('/:id/discussion', requireAuth, getPosts);
router.post('/:id/discussion', requireAuth, createPost);
router.get('/:id/groups', requireAuth, getGroupsByCourse);
router.get('/:id/assignments/stats', requireInstructor, getAssignmentStats);

export default router;
