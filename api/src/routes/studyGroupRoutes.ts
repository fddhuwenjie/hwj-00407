import { Router } from 'express';
import { requireAuth, requireInstructor } from '../middleware/currentUser.js';
import {
  createGroup,
  getMyGroups,
  getGroupsByCourse,
  getGroupById,
  joinGroup,
  approveMember,
  rejectMember,
  removeMember,
  setWeeklyGoal,
  getGroupProgress,
  getAllGroupsForInstructor,
  createDiscussion,
  getDiscussions,
  createDiscussionReply,
} from '../controllers/StudyGroupController.js';

const router = Router();

router.post('/', requireAuth, createGroup);
router.get('/my', requireAuth, getMyGroups);
router.get('/courses/:courseId', requireAuth, getGroupsByCourse);
router.get('/:groupId', requireAuth, getGroupById);
router.post('/:groupId/join', requireAuth, joinGroup);
router.post('/:groupId/members/:userId/approve', requireAuth, approveMember);
router.post('/:groupId/members/:userId/reject', requireAuth, rejectMember);
router.delete('/:groupId/members/:userId', requireAuth, removeMember);
router.post('/:groupId/goal', requireAuth, setWeeklyGoal);
router.get('/:groupId/progress', requireAuth, getGroupProgress);
router.get('/instructor/groups', requireInstructor, getAllGroupsForInstructor);
router.post('/:groupId/discussions', requireAuth, createDiscussion);
router.get('/:groupId/discussions', requireAuth, getDiscussions);
router.post('/discussions/:discussionId/replies', requireAuth, createDiscussionReply);

export default router;
