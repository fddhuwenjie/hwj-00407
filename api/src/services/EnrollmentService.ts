import { Enrollment, User, Course } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Enrollment as EnrollmentType, User as UserType, Course as CourseType } from '../../../shared/types.js';

class EnrollmentService {
  async enrollCourse(userId: number, courseId: number): Promise<EnrollmentType> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const course = await Course.findByPk(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const existingEnrollment = await Enrollment.findOne({
        where: { userId, courseId },
      });

      if (existingEnrollment) {
        throw new AppError('User is already enrolled in this course', 400);
      }

      const enrollment = await Enrollment.create({
        userId,
        courseId,
        enrolledAt: new Date(),
      });

      return enrollment as unknown as EnrollmentType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to enroll in course', 500);
    }
  }

  async getUserEnrollments(userId: number): Promise<EnrollmentType[]> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const enrollments = await Enrollment.findAll({
        where: { userId },
        include: [
          {
            model: Course,
            as: 'course',
            include: [
              {
                model: User,
                as: 'instructor',
                attributes: ['id', 'name', 'avatar'],
              },
            ],
          },
        ],
        order: [['enrolledAt', 'DESC']],
      });

      return enrollments as unknown as EnrollmentType[];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch user enrollments', 500);
    }
  }

  async getCourseEnrollments(courseId: number): Promise<EnrollmentType[]> {
    try {
      const course = await Course.findByPk(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const enrollments = await Enrollment.findAll({
        where: { courseId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'avatar'],
          },
        ],
        order: [['enrolledAt', 'DESC']],
      });

      return enrollments as unknown as EnrollmentType[];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch course enrollments', 500);
    }
  }

  async isEnrolled(userId: number, courseId: number): Promise<boolean> {
    try {
      const enrollment = await Enrollment.findOne({
        where: { userId, courseId },
      });

      return !!enrollment;
    } catch (error) {
      throw new AppError('Failed to check enrollment status', 500);
    }
  }
}

export default new EnrollmentService();
