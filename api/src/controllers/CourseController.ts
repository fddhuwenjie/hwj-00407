import { Request, Response } from 'express';
import { param, body, validationResult } from 'express-validator';
import CourseService from '../services/CourseService.js';
import EnrollmentService from '../services/EnrollmentService.js';
import LearningService from '../services/LearningService.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAllCourses = async (req: Request, res: Response) => {
  const courses = await CourseService.getAllCourses();
  res.status(200).json({
    success: true,
    data: courses,
  });
};

export const getCourseById = [
  param('id').isInt().withMessage('Course ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const id = Number(req.params.id);
    const course = await CourseService.getCourseById(id);
    res.status(200).json({
      success: true,
      data: course,
    });
  },
];

export const createCourse = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('coverImageUrl').notEmpty().withMessage('Cover image URL is required'),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Difficulty must be beginner, intermediate, or advanced'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const { title, description, category, coverImageUrl, difficulty } = req.body;
    const course = await CourseService.createCourse({
      title,
      description,
      category,
      coverImageUrl,
      difficulty,
      instructorId: req.currentUser.id,
    });
    res.status(201).json({
      success: true,
      data: course,
    });
  },
];

export const enrollCourse = [
  param('id').isInt().withMessage('Course ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const courseId = Number(req.params.id);
    const enrollment = await EnrollmentService.enrollCourse(req.currentUser.id, courseId);
    res.status(201).json({
      success: true,
      data: enrollment,
    });
  },
];

export const getProgress = [
  param('id').isInt().withMessage('Course ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const courseId = Number(req.params.id);
    const progress = await LearningService.getCourseProgress(req.currentUser.id, courseId);
    res.status(200).json({
      success: true,
      data: progress,
    });
  },
];
