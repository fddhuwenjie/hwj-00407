import { fn, col, literal, Op } from 'sequelize';
import {
  Course,
  Enrollment,
  LearningProgress,
  Lesson,
  Chapter,
  QuizAttempt,
  DiscussionPost,
  User,
} from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type {
  DashboardStats,
  DailyEnrollment,
  LessonCompletion,
  StudyTimeDistribution,
} from '../../../shared/types.js';

class DashboardService {
  async getStats(instructorId: number): Promise<DashboardStats> {
    try {
      const instructor = await User.findByPk(instructorId);
      if (!instructor) {
        throw new AppError('Instructor not found', 404);
      }

      if (instructor.role !== 'instructor') {
        throw new AppError('User is not an instructor', 400);
      }

      const courses = await Course.findAll({
        where: { instructorId },
        attributes: ['id'],
      });

      const courseIds = courses.map(c => c.id);
      const totalCourses = courseIds.length;

      if (totalCourses === 0) {
        return {
          totalStudents: 0,
          totalCourses: 0,
          averageCompletionRate: 0,
          averageQuizScore: 0,
          discussionHeat: 0,
        };
      }

      const totalStudentsResult = await Enrollment.count({
        where: { courseId: courseIds },
        distinct: true,
        col: 'userId',
      });

      const totalStudents = totalStudentsResult;

      const allLessons = await Lesson.findAll({
        include: [
          {
            model: Chapter,
            as: 'chapter',
            where: { courseId: courseIds },
            attributes: [],
            required: true,
          },
        ],
        attributes: ['id'],
      });

      const totalLessons = allLessons.length;

      let completedLessonCount = 0;
      if (totalLessons > 0) {
        completedLessonCount = await LearningProgress.count({
          where: {
            lessonId: allLessons.map(l => l.id),
            completed: true,
          },
          distinct: true,
          col: 'lessonId',
        });
      }

      const averageCompletionRate = totalLessons > 0
        ? Math.round((completedLessonCount / totalLessons) * 100)
        : 0;

      const avgScoreResult = await QuizAttempt.findOne({
        where: {
          lessonId: allLessons.map(l => l.id),
        },
        attributes: [
          [fn('AVG', col('score')), 'avgScore'],
        ],
        raw: true,
      });

      const averageQuizScore = Math.round((avgScoreResult as any)?.avgScore || 0);

      const discussionHeat = await DiscussionPost.count({
        where: { courseId: courseIds },
      });

      return {
        totalStudents,
        totalCourses,
        averageCompletionRate,
        averageQuizScore,
        discussionHeat,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch dashboard stats', 500);
    }
  }

  async getDailyEnrollments(courseId: number, days: number): Promise<DailyEnrollment[]> {
    try {
      const course = await Course.findByPk(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - (days - 1));
      startDate.setHours(0, 0, 0, 0);

      const results = await Enrollment.findAll({
        where: {
          courseId,
          enrolledAt: {
            [Op.gte]: startDate,
          },
        },
        attributes: [
          [fn('DATE', col('enrolledAt')), 'date'],
          [fn('COUNT', col('id')), 'count'],
        ],
        group: [fn('DATE', col('enrolledAt'))],
        order: [[fn('DATE', col('enrolledAt')), 'ASC']],
        raw: true,
      });

      const enrollmentMap = new Map(
        results.map((r: any) => [r.date, r.count])
      );

      const dailyEnrollments: DailyEnrollment[] = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dailyEnrollments.push({
          date: dateStr,
          count: Number(enrollmentMap.get(dateStr) || 0),
        });
      }

      return dailyEnrollments;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch daily enrollments', 500);
    }
  }

  async getLessonCompletion(courseId: number): Promise<LessonCompletion[]> {
    try {
      const course = await Course.findByPk(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const lessons = await Lesson.findAll({
        include: [
          {
            model: Chapter,
            as: 'chapter',
            where: { courseId },
            attributes: ['order'],
            required: true,
          },
        ],
        attributes: ['id', 'title'],
        order: [
          [col('chapter.order'), 'ASC'],
          ['order', 'ASC'],
        ],
      });

      const totalStudents = await Enrollment.count({
        where: { courseId },
        distinct: true,
        col: 'userId',
      });

      if (totalStudents === 0) {
        return lessons.map(lesson => ({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          completionRate: 0,
          totalStudents: 0,
          completedStudents: 0,
        }));
      }

      const lessonCompletionPromises = lessons.map(async (lesson) => {
        const completedStudents = await LearningProgress.count({
          where: {
            lessonId: lesson.id,
            completed: true,
          },
          distinct: true,
          col: 'userId',
        });

        const completionRate = Math.round((completedStudents / totalStudents) * 100);

        return {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          completionRate,
          totalStudents,
          completedStudents,
        };
      });

      const results = await Promise.all(lessonCompletionPromises);

      return results.sort((a, b) => a.completionRate - b.completionRate);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch lesson completion', 500);
    }
  }

  async getStudyTimeDistribution(courseId: number): Promise<StudyTimeDistribution[]> {
    try {
      const course = await Course.findByPk(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const enrollments = await Enrollment.findAll({
        where: { courseId },
        attributes: ['userId'],
        raw: true,
      });

      const userIds = enrollments.map((e: any) => e.userId);

      if (userIds.length === 0) {
        return [
          { range: '0-30min', count: 0 },
          { range: '30-60min', count: 0 },
          { range: '60-120min', count: 0 },
          { range: '120+min', count: 0 },
        ];
      }

      const userTimePromises = userIds.map(async (userId: number) => {
        const result = await LearningProgress.findOne({
          where: { userId, courseId },
          attributes: [
            [fn('SUM', col('timeSpent')), 'totalTime'],
          ],
          raw: true,
        });
        return {
          userId,
          totalSeconds: (result as any)?.totalTime || 0,
        };
      });

      const userTimes = await Promise.all(userTimePromises);

      const ranges = [
        { range: '0-30min', min: 0, max: 30 * 60, count: 0 },
        { range: '30-60min', min: 30 * 60, max: 60 * 60, count: 0 },
        { range: '60-120min', min: 60 * 60, max: 120 * 60, count: 0 },
        { range: '120+min', min: 120 * 60, max: Infinity, count: 0 },
      ];

      for (const userTime of userTimes) {
        for (const range of ranges) {
          if (userTime.totalSeconds >= range.min && userTime.totalSeconds < range.max) {
            range.count++;
            break;
          }
        }
      }

      return ranges.map(({ range, count }) => ({ range, count }));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch study time distribution', 500);
    }
  }
}

export default new DashboardService();
