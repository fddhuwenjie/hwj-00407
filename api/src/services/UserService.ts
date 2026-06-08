import { User } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type { User as UserType, UserRole } from '../../../shared/types.js';

class UserService {
  async getAllUsers(): Promise<UserType[]> {
    try {
      const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'role', 'avatar', 'createdAt'],
        order: [['createdAt', 'DESC']],
      });
      return users as unknown as UserType[];
    } catch (error) {
      throw new AppError('Failed to fetch users', 500);
    }
  }

  async getUserById(id: number): Promise<UserType> {
    try {
      const user = await User.findByPk(id, {
        attributes: ['id', 'name', 'email', 'role', 'avatar', 'createdAt'],
      });
      if (!user) {
        throw new AppError('User not found', 404);
      }
      return user as unknown as UserType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch user', 500);
    }
  }

  async getStudents(): Promise<UserType[]> {
    try {
      const students = await User.findAll({
        where: { role: 'student' as UserRole },
        attributes: ['id', 'name', 'email', 'role', 'avatar', 'createdAt'],
        order: [['createdAt', 'DESC']],
      });
      return students as unknown as UserType[];
    } catch (error) {
      throw new AppError('Failed to fetch students', 500);
    }
  }

  async getInstructors(): Promise<UserType[]> {
    try {
      const instructors = await User.findAll({
        where: { role: 'instructor' as UserRole },
        attributes: ['id', 'name', 'email', 'role', 'avatar', 'createdAt'],
        order: [['createdAt', 'DESC']],
      });
      return instructors as unknown as UserType[];
    } catch (error) {
      throw new AppError('Failed to fetch instructors', 500);
    }
  }
}

export default new UserService();
