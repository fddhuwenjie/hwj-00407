import { fn, col } from 'sequelize';
import { LearningProgress, Lesson, Chapter, Course, QuizAttempt } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type { CourseProgress } from '../../../shared/types.js';

interface OrderedLesson {
  id: number;
  chapterId: number;
  title: string;
  type: 'video' | 'document' | 'quiz';
  order: number;
  chapterOrder: number;
}

class LearningService {
  private async getOrderedLessons(courseId: number): Promise<OrderedLesson[]> {
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
      attributes: ['id', 'chapterId', 'title', 'type', 'order'],
      order: [
        [col('chapter.order'), 'ASC'],
        ['order', 'ASC'],
      ],
    });

    return lessons.map(lesson => ({
      id: lesson.id,
      chapterId: lesson.chapterId,
      title: lesson.title,
      type: lesson.type,
      order: lesson.order,
      chapterOrder: (lesson as any).chapter.order,
    }));
  }

  private async getLessonIndex(orderedLessons: OrderedLesson[], lessonId: number): Promise<number> {
    const index = orderedLessons.findIndex(l => l.id === lessonId);
    if (index === -1) {
      throw new AppError('Lesson not found in this course', 404);
    }
    return index;
  }

  async checkLessonUnlocked(userId: number, lessonId: number): Promise<boolean> {
    try {
      const lesson = await Lesson.findByPk(lessonId, {
        include: [
          {
            model: Chapter,
            as: 'chapter',
            include: [
              {
                model: Course,
                as: 'course',
              },
            ],
          },
        ],
      });

      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      const courseId = (lesson as any).chapter.course.id;
      const orderedLessons = await this.getOrderedLessons(courseId);
      const currentIndex = await this.getLessonIndex(orderedLessons, lessonId);

      if (currentIndex === 0) {
        return true;
      }

      const previousLessonId = orderedLessons[currentIndex - 1].id;
      const previousProgress = await LearningProgress.findOne({
        where: { userId, lessonId: previousLessonId },
      });

      return !!previousProgress?.completed;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to check lesson unlock status', 500);
    }
  }

  async getCourseProgress(userId: number, courseId: number): Promise<CourseProgress> {
    try {
      const course = await Course.findByPk(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const orderedLessons = await this.getOrderedLessons(courseId);
      const totalLessons = orderedLessons.length;

      if (totalLessons === 0) {
        return {
          courseId,
          totalLessons: 0,
          completedLessons: 0,
          progressPercentage: 0,
          totalTimeSpent: 0,
          lessons: [],
        };
      }

      const progressRecords = await LearningProgress.findAll({
        where: { userId, courseId },
      });

      const progressMap = new Map(
        progressRecords.map(p => [p.lessonId, p])
      );

      const lessonsProgress: CourseProgress['lessons'] = [];
      let completedLessons = 0;
      let totalTimeSpent = 0;

      for (let i = 0; i < orderedLessons.length; i++) {
        const lesson = orderedLessons[i];
        const progress = progressMap.get(lesson.id);

        let unlocked = false;
        if (i === 0) {
          unlocked = true;
        } else {
          const previousProgress = progressMap.get(orderedLessons[i - 1].id);
          unlocked = !!previousProgress?.completed;
        }

        const completed = !!progress?.completed;
        if (completed) {
          completedLessons++;
        }
        totalTimeSpent += progress?.timeSpent || 0;

        lessonsProgress.push({
          lessonId: lesson.id,
          completed,
          timeSpent: progress?.timeSpent || 0,
          unlocked,
        });
      }

      const progressPercentage = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

      return {
        courseId,
        totalLessons,
        completedLessons,
        progressPercentage,
        totalTimeSpent,
        lessons: lessonsProgress,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch course progress', 500);
    }
  }

  async markLessonComplete(userId: number, lessonId: number, timeSpent: number): Promise<void> {
    try {
      const lesson = await Lesson.findByPk(lessonId, {
        include: [
          {
            model: Chapter,
            as: 'chapter',
            include: [
              {
                model: Course,
                as: 'course',
              },
            ],
          },
        ],
      });

      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      const courseId = (lesson as any).chapter.course.id;
      const orderedLessons = await this.getOrderedLessons(courseId);
      const currentIndex = await this.getLessonIndex(orderedLessons, lessonId);

      if (currentIndex > 0) {
        const previousLessonId = orderedLessons[currentIndex - 1].id;
        const previousProgress = await LearningProgress.findOne({
          where: { userId, lessonId: previousLessonId },
        });

        if (!previousProgress?.completed) {
          throw new AppError('Previous lesson must be completed first', 400);
        }
      }

      if (lesson.type === 'quiz') {
        const highestScore = await QuizAttempt.findOne({
          where: { userId, lessonId },
          order: [['score', 'DESC']],
        });

        if (!highestScore || highestScore.score < 80) {
          throw new AppError('Quiz must be passed with 80% or higher score', 400);
        }
      }

      const [progress, created] = await LearningProgress.findOrCreate({
        where: { userId, courseId, lessonId },
        defaults: {
          userId,
          courseId,
          lessonId,
          completed: true,
          completedAt: new Date(),
          timeSpent: timeSpent || 0,
        },
      });

      if (!created && !progress.completed) {
        await progress.update({
          completed: true,
          completedAt: new Date(),
          timeSpent: Math.max(progress.timeSpent, timeSpent || 0),
        });
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to mark lesson complete', 500);
    }
  }

  async updateTimeSpent(userId: number, lessonId: number, timeSpent: number): Promise<void> {
    try {
      const lesson = await Lesson.findByPk(lessonId, {
        include: [
          {
            model: Chapter,
            as: 'chapter',
            include: [
              {
                model: Course,
                as: 'course',
              },
            ],
          },
        ],
      });

      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      const courseId = (lesson as any).chapter.course.id;

      const [progress] = await LearningProgress.findOrCreate({
        where: { userId, courseId, lessonId },
        defaults: {
          userId,
          courseId,
          lessonId,
          completed: false,
          timeSpent: timeSpent || 0,
        },
      });

      if (!progress.isNewRecord) {
        await progress.update({
          timeSpent: (progress.timeSpent || 0) + (timeSpent || 0),
        });
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update time spent', 500);
    }
  }

  async getTotalTimeSpent(userId: number, courseId: number): Promise<number> {
    try {
      const result = await LearningProgress.findOne({
        where: { userId, courseId },
        attributes: [
          [fn('SUM', col('timeSpent')), 'totalTime'],
        ],
        raw: true,
      });

      return (result as any)?.totalTime || 0;
    } catch (error) {
      throw new AppError('Failed to fetch total time spent', 500);
    }
  }
}

export default new LearningService();
