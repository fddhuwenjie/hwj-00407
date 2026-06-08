import { Certificate, User, Course, Lesson, Chapter, LearningProgress } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { col } from 'sequelize';
import type { Certificate as CertificateType } from '../../../shared/types.js';

class CertificateService {
  generateCertificateNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CERT-${year}${month}${day}-${random}`;
  }

  private async isCourseCompleted(userId: number, courseId: number): Promise<boolean> {
    const lessons = await Lesson.findAll({
      include: [
        {
          model: Chapter,
          as: 'chapter',
          where: { courseId },
          attributes: [],
          required: true,
        },
      ],
      attributes: ['id'],
    });

    const totalLessons = lessons.length;
    if (totalLessons === 0) {
      return false;
    }

    const completedProgress = await LearningProgress.count({
      where: {
        userId,
        courseId,
        completed: true,
        lessonId: lessons.map(l => l.id),
      },
    });

    return completedProgress === totalLessons;
  }

  async generateCertificate(userId: number, courseId: number): Promise<CertificateType> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const course = await Course.findByPk(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const existingCertificate = await Certificate.findOne({
        where: { userId, courseId },
      });

      if (existingCertificate) {
        throw new AppError('Certificate already exists for this course', 400);
      }

      const isCompleted = await this.isCourseCompleted(userId, courseId);
      if (!isCompleted) {
        throw new AppError('Course must be 100% completed to generate certificate', 400);
      }

      let certificateNumber: string;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        certificateNumber = this.generateCertificateNumber();
        const existing = await Certificate.findOne({
          where: { certificateNumber },
        });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique!) {
        throw new AppError('Failed to generate unique certificate number', 500);
      }

      const certificate = await Certificate.create({
        userId,
        courseId,
        certificateNumber: certificateNumber!,
        issuedAt: new Date(),
      });

      return certificate as unknown as CertificateType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to generate certificate', 500);
    }
  }

  async getCertificateByNumber(number: string): Promise<CertificateType> {
    try {
      const certificate = await Certificate.findOne({
        where: { certificateNumber: number },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'avatar'],
          },
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
      });

      if (!certificate) {
        throw new AppError('Certificate not found', 404);
      }

      return certificate as unknown as CertificateType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch certificate', 500);
    }
  }

  async verifyCertificate(number: string): Promise<{ valid: boolean; certificate?: CertificateType }> {
    try {
      const certificate = await Certificate.findOne({
        where: { certificateNumber: number },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'avatar'],
          },
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
      });

      if (!certificate) {
        return { valid: false };
      }

      return {
        valid: true,
        certificate: certificate as unknown as CertificateType,
      };
    } catch (error) {
      throw new AppError('Failed to verify certificate', 500);
    }
  }

  async getUserCertificates(userId: number): Promise<CertificateType[]> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const certificates = await Certificate.findAll({
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
        order: [['issuedAt', 'DESC']],
      });

      return certificates as unknown as CertificateType[];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch user certificates', 500);
    }
  }
}

export default new CertificateService();
