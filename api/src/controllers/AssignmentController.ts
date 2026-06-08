import { Request, Response } from 'express';
import { param, body, validationResult } from 'express-validator';
import AssignmentService from '../services/AssignmentService.js';
import { AppError } from '../middleware/errorHandler.js';

export const createAssignment = [
  param('id').isInt().withMessage('Lesson ID must be a valid integer'),
  body('description').isString().notEmpty().withMessage('Description is required'),
  body('dueDate').isISO8601().withMessage('Due date must be a valid ISO 8601 date'),
  body('maxScore').isInt({ min: 1 }).withMessage('Max score must be a positive integer'),
  body('allowLateSubmission').isBoolean().withMessage('Allow late submission must be a boolean'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const lessonId = Number(req.params.id);
    const { description, dueDate, maxScore, allowLateSubmission } = req.body;

    const assignment = await AssignmentService.createAssignment(lessonId, {
      description,
      dueDate: new Date(dueDate),
      maxScore,
      allowLateSubmission,
    });

    res.status(201).json({
      success: true,
      data: assignment,
    });
  },
];

export const getAssignment = [
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
    const assignment = await AssignmentService.getAssignmentByLessonId(lessonId);

    res.status(200).json({
      success: true,
      data: assignment,
    });
  },
];

export const submitAssignment = [
  param('assignmentId').isInt().withMessage('Assignment ID must be a valid integer'),
  body('content').isString().notEmpty().withMessage('Content is required'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const assignmentId = Number(req.params.assignmentId);
    const { content } = req.body;

    const submission = await AssignmentService.submitAssignment(
      req.currentUser.id,
      assignmentId,
      content
    );

    res.status(201).json({
      success: true,
      data: submission,
    });
  },
];

export const getSubmissions = [
  param('assignmentId').isInt().withMessage('Assignment ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const assignmentId = Number(req.params.assignmentId);
    const submissions = await AssignmentService.getSubmissionsByAssignment(assignmentId);

    res.status(200).json({
      success: true,
      data: submissions,
    });
  },
];

export const getUserSubmission = [
  param('assignmentId').isInt().withMessage('Assignment ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const assignmentId = Number(req.params.assignmentId);
    const submission = await AssignmentService.getUserSubmission(
      req.currentUser.id,
      assignmentId
    );

    res.status(200).json({
      success: true,
      data: submission,
    });
  },
];

export const gradeSubmission = [
  param('assignmentId').isInt().withMessage('Assignment ID must be a valid integer'),
  param('submissionId').isInt().withMessage('Submission ID must be a valid integer'),
  body('score').isInt({ min: 0 }).withMessage('Score must be a non-negative integer'),
  body('feedback').isString().notEmpty().withMessage('Feedback is required'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const assignmentId = Number(req.params.assignmentId);
    const submissionId = Number(req.params.submissionId);
    const { score, feedback } = req.body;

    const submission = await AssignmentService.gradeAssignment(
      assignmentId,
      submissionId,
      score,
      feedback
    );

    res.status(200).json({
      success: true,
      data: submission,
    });
  },
];

export const getAssignmentStats = [
  param('courseId').isInt().withMessage('Course ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const courseId = Number(req.params.courseId);
    const stats = await AssignmentService.getAssignmentStats(courseId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  },
];
