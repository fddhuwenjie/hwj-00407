import { Request, Response } from 'express';
import { param, body, validationResult } from 'express-validator';
import CertificateService from '../services/CertificateService.js';
import { AppError } from '../middleware/errorHandler.js';

export const verifyCertificate = [
  param('number').notEmpty().withMessage('Certificate number is required'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const number = req.params.number;
    const result = await CertificateService.verifyCertificate(number);
    res.status(200).json({
      success: true,
      data: result,
    });
  },
];

export const getUserCertificates = [
  param('id').isInt().withMessage('User ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const userId = Number(req.params.id);
    const certificates = await CertificateService.getUserCertificates(userId);
    res.status(200).json({
      success: true,
      data: certificates,
    });
  },
];

export const generateCertificate = [
  body('courseId').isInt().withMessage('Course ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    if (!req.currentUser) {
      throw new AppError('Authentication required', 401);
    }

    const courseId = Number(req.body.courseId);
    const certificate = await CertificateService.generateCertificate(req.currentUser.id, courseId);
    res.status(201).json({
      success: true,
      data: certificate,
    });
  },
];
