import { Request, Response } from 'express';
import { param, body, query, validationResult } from 'express-validator';
import NoteService from '../services/NoteService.js';
import { AppError } from '../middleware/errorHandler.js';
import type { NoteTag } from '../../../shared/types.js';

export const createNote = [
  body('courseId').isInt().withMessage('Course ID must be a valid integer'),
  body('lessonId').isInt().withMessage('Lesson ID must be a valid integer'),
  body('content').isString().notEmpty().withMessage('Content is required'),
  body('timePoint').optional().isInt({ min: 0 }).withMessage('Time point must be a non-negative integer'),
  body('tag').optional().isIn(['normal', 'important', 'question']).withMessage('Tag must be normal, important, or question'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const courseId = Number(req.body.courseId);
    const lessonId = Number(req.body.lessonId);
    const content = req.body.content;
    const timePoint = req.body.timePoint ? Number(req.body.timePoint) : undefined;
    const tag = req.body.tag as NoteTag | undefined;

    const note = await NoteService.createNote(req.currentUser.id, {
      courseId,
      lessonId,
      content,
      timePoint,
      tag,
    });

    res.status(201).json({
      success: true,
      data: note,
    });
  },
];

export const updateNote = [
  param('noteId').isInt().withMessage('Note ID must be a valid integer'),
  body('content').optional().isString().notEmpty().withMessage('Content cannot be empty'),
  body('tag').optional().isIn(['normal', 'important', 'question']).withMessage('Tag must be normal, important, or question'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const noteId = Number(req.params.noteId);
    const content = req.body.content as string | undefined;
    const tag = req.body.tag as NoteTag | undefined;

    const note = await NoteService.updateNote(noteId, req.currentUser.id, {
      content,
      tag,
    });

    res.status(200).json({
      success: true,
      data: note,
    });
  },
];

export const deleteNote = [
  param('noteId').isInt().withMessage('Note ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const noteId = Number(req.params.noteId);

    await NoteService.deleteNote(noteId, req.currentUser.id);

    res.status(200).json({
      success: true,
      data: { message: 'Note deleted successfully' },
    });
  },
];

export const getMyNotes = [
  query('courseId').optional().isInt().withMessage('Course ID must be a valid integer'),
  query('tag').optional().isIn(['normal', 'important', 'question']).withMessage('Tag must be normal, important, or question'),
  query('search').optional().isString().withMessage('Search must be a string'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const filters = {
      courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
      tag: req.query.tag as string | undefined,
      search: req.query.search as string | undefined,
    };

    const notes = await NoteService.getNotesByUser(req.currentUser.id, filters);

    res.status(200).json({
      success: true,
      data: notes,
    });
  },
];

export const getLessonNotes = [
  param('lessonId').isInt().withMessage('Lesson ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const lessonId = Number(req.params.lessonId);
    const notes = await NoteService.getNotesByLesson(req.currentUser.id, lessonId);

    res.status(200).json({
      success: true,
      data: notes,
    });
  },
];

export const exportCourseNotes = [
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
    const content = await NoteService.exportNotesByCourse(req.currentUser.id, courseId);
    const filename = `course-notes-${courseId}-${Date.now()}.md`;

    res.status(200).json({
      success: true,
      data: {
        content,
        filename,
      },
    });
  },
];
