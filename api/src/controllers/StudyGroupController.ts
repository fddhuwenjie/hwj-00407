import { Request, Response } from 'express';
import { param, body, validationResult } from 'express-validator';
import StudyGroupService from '../services/StudyGroupService.js';
import { AppError } from '../middleware/errorHandler.js';

export const createGroup = [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('courseId').isInt().withMessage('Course ID must be a valid integer'),
  body('maxMembers').isInt({ min: 2 }).withMessage('Max members must be at least 2'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const { name, description, courseId, maxMembers } = req.body;
    const group = await StudyGroupService.createGroup(req.currentUser.id, {
      name,
      description,
      courseId: Number(courseId),
      maxMembers: Number(maxMembers),
    });
    res.status(201).json({
      success: true,
      data: group,
    });
  },
];

export const getMyGroups = async (req: Request, res: Response) => {
  if (!req.currentUser) {
    throw new AppError('Authentication required', 401);
  }

  const groups = await StudyGroupService.getUserGroups(req.currentUser.id);
  res.status(200).json({
    success: true,
    data: groups,
  });
};

export const getGroupsByCourse = [
  param('courseId').optional().isInt().withMessage('Course ID must be a valid integer'),
  param('id').optional().isInt().withMessage('Course ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const courseId = Number(req.params.courseId || req.params.id);
    const groups = await StudyGroupService.getGroupsByCourse(courseId);
    res.status(200).json({
      success: true,
      data: groups,
    });
  },
];

export const getGroupById = [
  param('groupId').isInt().withMessage('Group ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const groupId = Number(req.params.groupId);
    const group = await StudyGroupService.getGroupById(groupId);
    res.status(200).json({
      success: true,
      data: group,
    });
  },
];

export const joinGroup = [
  param('groupId').isInt().withMessage('Group ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const groupId = Number(req.params.groupId);
    const membership = await StudyGroupService.joinGroup(req.currentUser.id, groupId);
    res.status(201).json({
      success: true,
      data: membership,
    });
  },
];

export const approveMember = [
  param('groupId').isInt().withMessage('Group ID must be a valid integer'),
  param('userId').isInt().withMessage('User ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const groupId = Number(req.params.groupId);
    const userId = Number(req.params.userId);
    const member = await StudyGroupService.approveMember(groupId, userId, req.currentUser.id);
    res.status(200).json({
      success: true,
      data: member,
    });
  },
];

export const rejectMember = [
  param('groupId').isInt().withMessage('Group ID must be a valid integer'),
  param('userId').isInt().withMessage('User ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const groupId = Number(req.params.groupId);
    const userId = Number(req.params.userId);
    const member = await StudyGroupService.rejectMember(groupId, userId, req.currentUser.id);
    res.status(200).json({
      success: true,
      data: member,
    });
  },
];

export const removeMember = [
  param('groupId').isInt().withMessage('Group ID must be a valid integer'),
  param('userId').isInt().withMessage('User ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const groupId = Number(req.params.groupId);
    const userId = Number(req.params.userId);
    await StudyGroupService.removeMember(groupId, userId, req.currentUser.id);
    res.status(200).json({
      success: true,
      data: { message: 'Member removed successfully' },
    });
  },
];

export const setWeeklyGoal = [
  param('groupId').isInt().withMessage('Group ID must be a valid integer'),
  body('lessonsToComplete').isInt({ min: 1 }).withMessage('Lessons to complete must be at least 1'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const groupId = Number(req.params.groupId);
    const lessonsToComplete = Number(req.body.lessonsToComplete);
    const goal = await StudyGroupService.setWeeklyGoal(groupId, req.currentUser.id, lessonsToComplete);
    res.status(200).json({
      success: true,
      data: goal,
    });
  },
];

export const getGroupProgress = [
  param('groupId').isInt().withMessage('Group ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const groupId = Number(req.params.groupId);
    const progress = await StudyGroupService.getGroupProgress(groupId);
    res.status(200).json({
      success: true,
      data: progress,
    });
  },
];

export const getAllGroupsForInstructor = async (req: Request, res: Response) => {
  if (!req.currentUser) {
    throw new AppError('Authentication required', 401);
  }

  const groups = await StudyGroupService.getAllGroupsWithActivity();
  res.status(200).json({
    success: true,
    data: groups,
  });
};

export const createDiscussion = [
  param('groupId').isInt().withMessage('Group ID must be a valid integer'),
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const groupId = Number(req.params.groupId);
    const { title, content } = req.body;
    const discussion = await StudyGroupService.createDiscussion(groupId, req.currentUser.id, title, content);
    res.status(201).json({
      success: true,
      data: discussion,
    });
  },
];

export const getDiscussions = [
  param('groupId').isInt().withMessage('Group ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const groupId = Number(req.params.groupId);
    const discussions = await StudyGroupService.getDiscussionsByGroup(groupId);
    res.status(200).json({
      success: true,
      data: discussions,
    });
  },
];

export const createDiscussionReply = [
  param('discussionId').isInt().withMessage('Discussion ID must be a valid integer'),
  body('content').notEmpty().withMessage('Content is required'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const discussionId = Number(req.params.discussionId);
    const { content } = req.body;
    const reply = await StudyGroupService.createDiscussionReply(discussionId, req.currentUser.id, content);
    res.status(201).json({
      success: true,
      data: reply,
    });
  },
];
