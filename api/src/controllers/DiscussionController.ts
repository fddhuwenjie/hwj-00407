import { Request, Response } from 'express';
import { param, body, validationResult } from 'express-validator';
import DiscussionService from '../services/DiscussionService.js';
import { AppError } from '../middleware/errorHandler.js';

export const getPosts = [
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
    const posts = await DiscussionService.getPosts(courseId);
    res.status(200).json({
      success: true,
      data: posts,
    });
  },
];

export const createPost = [
  param('id').isInt().withMessage('Course ID must be a valid integer'),
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

    const courseId = Number(req.params.id);
    const { title, content } = req.body;
    const post = await DiscussionService.createPost(req.currentUser.id, courseId, { title, content });
    res.status(201).json({
      success: true,
      data: post,
    });
  },
];

export const createReply = [
  param('postId').isInt().withMessage('Post ID must be a valid integer'),
  body('content').notEmpty().withMessage('Content is required'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const postId = Number(req.params.postId);
    const { content } = req.body;
    const reply = await DiscussionService.createReply(req.currentUser.id, postId, content);
    res.status(201).json({
      success: true,
      data: reply,
    });
  },
];

export const toggleFeatured = [
  param('postId').isInt().withMessage('Post ID must be a valid integer'),
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

    const postId = Number(req.params.postId);
    const post = await DiscussionService.toggleFeatured(postId);
    res.status(200).json({
      success: true,
      data: post,
    });
  },
];

export const togglePinned = [
  param('postId').isInt().withMessage('Post ID must be a valid integer'),
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

    const postId = Number(req.params.postId);
    const post = await DiscussionService.togglePinned(postId);
    res.status(200).json({
      success: true,
      data: post,
    });
  },
];
