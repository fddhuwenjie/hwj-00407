import { Request, Response } from 'express';
import { param, body, validationResult } from 'express-validator';
import LearningService from '../services/LearningService.js';
import QuizService from '../services/QuizService.js';
import { AppError } from '../middleware/errorHandler.js';

export const markComplete = [
  param('id').isInt().withMessage('Lesson ID must be a valid integer'),
  body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be a non-negative integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const lessonId = Number(req.params.id);
    const timeSpent = Number(req.body.timeSpent || 0);

    await LearningService.markLessonComplete(req.currentUser.id, lessonId, timeSpent);
    res.status(200).json({
      success: true,
      data: { message: 'Lesson marked as complete' },
    });
  },
];

export const getQuiz = [
  param('id').isInt().withMessage('Lesson ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const lessonId = Number(req.params.id);
    const questions = await QuizService.getQuizQuestions(lessonId);
    res.status(200).json({
      success: true,
      data: questions,
    });
  },
];

export const submitQuiz = [
  param('id').isInt().withMessage('Lesson ID must be a valid integer'),
  body('answers').isObject().withMessage('Answers must be an object'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const lessonId = Number(req.params.id);
    const answers = req.body.answers as Record<number, number[]>;

    const result = await QuizService.submitQuiz(req.currentUser.id, lessonId, answers);
    res.status(200).json({
      success: true,
      data: result,
    });
  },
];
