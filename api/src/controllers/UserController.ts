import { Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import UserService from '../services/UserService.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAllUsers = async (req: Request, res: Response) => {
  const users = await UserService.getAllUsers();
  res.status(200).json({
    success: true,
    data: users,
  });
};

export const getUserById = [
  param('id').isInt().withMessage('User ID must be a valid integer'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const id = Number(req.params.id);
    const user = await UserService.getUserById(id);
    res.status(200).json({
      success: true,
      data: user,
    });
  },
];
