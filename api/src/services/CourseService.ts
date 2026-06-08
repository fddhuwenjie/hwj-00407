import { fn, col, literal } from 'sequelize';
import { Course, Chapter, Lesson, QuizQuestion, User, Enrollment } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Course as CourseType, Chapter as ChapterType, Lesson as LessonType, QuizQuestion as QuizQuestionType } from '../../../shared/types.js';

class CourseService {
  async getAllCourses(): Promise<CourseType[]> {
    try {
      const courses = await Course.findAll({
        include: [
          {
            model: User,
            as: 'instructor',
            attributes: ['id', 'name', 'avatar'],
          },
        ],
        attributes: {
          include: [
            [
              literal(`(
                SELECT COUNT(*) 
                FROM enrollments 
                WHERE enrollments.courseId = Course.id
              )`),
              'enrollmentCount',
            ],
          ],
        },
        order: [['createdAt', 'DESC']],
      });

      return courses.map(course => ({
        ...course.toJSON(),
        _count: {
          enrollments: course.getDataValue('enrollmentCount') || 0,
        },
      })) as unknown as CourseType[];
    } catch (error) {
      throw new AppError('Failed to fetch courses', 500);
    }
  }

  async getCourseById(id: number): Promise<CourseType> {
    try {
      const course = await Course.findByPk(id, {
        include: [
          {
            model: User,
            as: 'instructor',
            attributes: ['id', 'name', 'avatar'],
          },
          {
            model: Chapter,
            as: 'chapters',
            order: [['order', 'ASC']],
            include: [
              {
                model: Lesson,
                as: 'lessons',
                order: [['order', 'ASC']],
                include: [
                  {
                    model: QuizQuestion,
                    as: 'questions',
                    order: [['order', 'ASC']],
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      return course as unknown as CourseType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch course', 500);
    }
  }

  async createCourse(data: {
    title: string;
    description: string;
    category: string;
    coverImageUrl: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    instructorId: number;
  }): Promise<CourseType> {
    try {
      const course = await Course.create(data);
      return course as unknown as CourseType;
    } catch (error) {
      throw new AppError('Failed to create course', 500);
    }
  }

  async updateCourse(id: number, data: Partial<{
    title: string;
    description: string;
    category: string;
    coverImageUrl: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }>): Promise<CourseType> {
    try {
      const course = await Course.findByPk(id);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      await course.update(data);
      return course as unknown as CourseType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update course', 500);
    }
  }

  async deleteCourse(id: number): Promise<void> {
    try {
      const course = await Course.findByPk(id);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      await course.destroy();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete course', 500);
    }
  }

  async createChapter(courseId: number, data: {
    title: string;
    order: number;
  }): Promise<ChapterType> {
    try {
      const course = await Course.findByPk(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const chapter = await Chapter.create({
        courseId,
        ...data,
      });

      return chapter as unknown as ChapterType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create chapter', 500);
    }
  }

  async createLesson(chapterId: number, data: {
    title: string;
    type: 'video' | 'document' | 'quiz';
    content: string;
    order: number;
    duration?: number;
  }): Promise<LessonType> {
    try {
      const chapter = await Chapter.findByPk(chapterId);
      if (!chapter) {
        throw new AppError('Chapter not found', 404);
      }

      const lesson = await Lesson.create({
        chapterId,
        ...data,
      });

      return lesson as unknown as LessonType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create lesson', 500);
    }
  }

  async createQuizQuestion(lessonId: number, data: {
    type: 'single' | 'multiple' | 'boolean';
    question: string;
    options: string[];
    correctAnswers: number[];
    explanation: string;
    order: number;
  }): Promise<QuizQuestionType> {
    try {
      const lesson = await Lesson.findByPk(lessonId);
      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      if (lesson.type !== 'quiz') {
        throw new AppError('Can only add quiz questions to quiz lessons', 400);
      }

      const question = await QuizQuestion.create({
        lessonId,
        ...data,
      });

      return question as unknown as QuizQuestionType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create quiz question', 500);
    }
  }
}

export default new CourseService();
