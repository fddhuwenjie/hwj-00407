import { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import DashboardService from '../services/DashboardService.js';
import { AppError } from '../middleware/errorHandler.js';

export const getStats = async (req: Request, res: Response) => {
  if (!req.currentUser) {
    throw new AppError('Authentication required', 401);
  }

  if (req.currentUser.role !== 'instructor') {
    throw new AppError('Instructor role required', 403);
  }

  const stats = await DashboardService.getStats(req.currentUser.id);
  res.status(200).json({
    success: true,
    data: stats,
  });
};

export const getDailyEnrollments = [
  query('courseId').isInt().withMessage('Course ID must be a valid integer'),
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    if (req.currentUser.role !== 'instructor') {
      throw new AppError('Instructor role required', 403);
    }

    const courseId = Number(req.query.courseId);
    const days = Number(req.query.days || 7);
    const data = await DashboardService.getDailyEnrollments(courseId, days);
    res.status(200).json({
      success: true,
      data,
    });
  },
];

export const getLessonCompletion = [
  query('courseId').isInt().withMessage('Course ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    if (req.currentUser.role !== 'instructor') {
      throw new AppError('Instructor role required', 403);
    }

    const courseId = Number(req.query.courseId);
    const data = await DashboardService.getLessonCompletion(courseId);
    res.status(200).json({
      success: true,
      data,
    });
  },
];

export const getStudyTimeDistribution = [
  query('courseId').isInt().withMessage('Course ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    if (req.currentUser.role !== 'instructor') {
      throw new AppError('Instructor role required', 403);
    }

    const courseId = Number(req.query.courseId);
    const data = await DashboardService.getStudyTimeDistribution(courseId);
    res.status(200).json({
      success: true,
      data,
    });
  },
];
