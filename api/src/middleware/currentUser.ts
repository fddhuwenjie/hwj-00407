import { Request, Response, NextFunction } from 'express';
import { User } from '../models/index.js';
import { AppError } from './errorHandler.js';

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

export const setCurrentUser = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const userId = req.headers['x-user-id'];

  if (userId) {
    const user = await User.findByPk(Number(userId));
    if (user) {
      req.currentUser = user;
    }
  }

  next();
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.currentUser) {
    throw new AppError('Authentication required', 401);
  }
  next();
};

export const requireInstructor = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.currentUser) {
    throw new AppError('Authentication required', 401);
  }
  if (req.currentUser.role !== 'instructor') {
    throw new AppError('Instructor role required', 403);
  }
  next();
};
