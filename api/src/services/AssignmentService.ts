import { Op, fn, col } from 'sequelize';
import type { Lesson as LessonType } from '../../../shared/types.js';
import {
  Assignment,
  AssignmentSubmission,
  Lesson,
  Chapter,
  Course,
  User,
  Enrollment,
} from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type {
  Assignment as AssignmentType,
  AssignmentSubmission as AssignmentSubmissionType,
  AssignmentStats as AssignmentStatsType,
} from '../../../shared/types.js';

class AssignmentService {
  async createAssignment(
    lessonId: number,
    data: {
      description: string;
      dueDate: Date;
      maxScore: number;
      allowLateSubmission: boolean;
    }
  ): Promise<AssignmentType> {
    try {
      const lesson = await Lesson.findByPk(lessonId);
      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      const existingAssignment = await Assignment.findOne({
        where: { lessonId },
      });
      if (existingAssignment) {
        throw new AppError('Assignment already exists for this lesson', 400);
      }

      const assignment = await Assignment.create({
        lessonId,
        ...data,
      });

      return assignment as unknown as AssignmentType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create assignment', 500);
    }
  }

  async getAssignmentByLessonId(lessonId: number): Promise<AssignmentType | null> {
    try {
      const assignment = await Assignment.findOne({
        where: { lessonId },
      });

      return assignment as unknown as AssignmentType | null;
    } catch (error) {
      throw new AppError('Failed to fetch assignment', 500);
    }
  }

  async getAssignmentById(assignmentId: number): Promise<AssignmentType> {
    try {
      const assignment = await Assignment.findByPk(assignmentId, {
        include: [
          {
            model: Lesson,
            as: 'lesson',
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
          },
          {
            model: AssignmentSubmission,
            as: 'submissions',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar'],
              },
            ],
          },
        ],
      });

      if (!assignment) {
        throw new AppError('Assignment not found', 404);
      }

      return assignment as unknown as AssignmentType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch assignment', 500);
    }
  }

  async submitAssignment(
    userId: number,
    assignmentId: number,
    content: string
  ): Promise<AssignmentSubmissionType> {
    try {
      const assignment = await Assignment.findByPk(assignmentId);
      if (!assignment) {
        throw new AppError('Assignment not found', 404);
      }

      const existingSubmission = await AssignmentSubmission.findOne({
        where: { userId, assignmentId },
      });
      if (existingSubmission) {
        throw new AppError('You have already submitted this assignment', 400);
      }

      const now = new Date();
      const isLate = now > new Date(assignment.dueDate);

      if (isLate && !assignment.allowLateSubmission) {
        throw new AppError('Late submissions are not allowed for this assignment', 400);
      }

      const submission = await AssignmentSubmission.create({
        userId,
        assignmentId,
        content,
        submittedAt: now,
        status: isLate ? 'late' : 'submitted',
      });

      return submission as unknown as AssignmentSubmissionType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to submit assignment', 500);
    }
  }

  async gradeAssignment(
    assignmentId: number,
    submissionId: number,
    score: number,
    feedback: string
  ): Promise<AssignmentSubmissionType> {
    try {
      const assignment = await Assignment.findByPk(assignmentId);
      if (!assignment) {
        throw new AppError('Assignment not found', 404);
      }

      const submission = await AssignmentSubmission.findByPk(submissionId);
      if (!submission) {
        throw new AppError('Submission not found', 404);
      }

      if (submission.assignmentId !== assignmentId) {
        throw new AppError('Submission does not belong to this assignment', 400);
      }

      if (score < 0 || score > assignment.maxScore) {
        throw new AppError(`Score must be between 0 and ${assignment.maxScore}`, 400);
      }

      await submission.update({
        score,
        feedback,
        gradedAt: new Date(),
        status: 'graded',
      });

      return submission as unknown as AssignmentSubmissionType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to grade assignment', 500);
    }
  }

  async getSubmissionsByAssignment(assignmentId: number): Promise<AssignmentSubmissionType[]> {
    try {
      const assignment = await Assignment.findByPk(assignmentId);
      if (!assignment) {
        throw new AppError('Assignment not found', 404);
      }

      const submissions = await AssignmentSubmission.findAll({
        where: { assignmentId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatar'],
          },
        ],
        order: [['submittedAt', 'DESC']],
      });

      return submissions as unknown as AssignmentSubmissionType[];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch submissions', 500);
    }
  }

  async getUserSubmission(
    userId: number,
    assignmentId: number
  ): Promise<AssignmentSubmissionType | null> {
    try {
      const submission = await AssignmentSubmission.findOne({
        where: { userId, assignmentId },
      });

      return submission as unknown as AssignmentSubmissionType | null;
    } catch (error) {
      throw new AppError('Failed to fetch user submission', 500);
    }
  }

  async getAssignmentStats(courseId: number): Promise<AssignmentStatsType[]> {
    try {
      const course = await Course.findByPk(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const totalEnrollments = await Enrollment.count({
        where: { courseId },
      });

      if (totalEnrollments === 0) {
        return [];
      }

      const assignments = await Assignment.findAll({
        include: [
          {
            model: Lesson,
            as: 'lesson',
            required: true,
            include: [
              {
                model: Chapter,
                as: 'chapter',
                required: true,
                where: { courseId },
              },
            ],
          },
          {
            model: AssignmentSubmission,
            as: 'submissions',
            required: false,
          },
        ],
      });

      const stats: AssignmentStatsType[] = [];

      for (const assignment of assignments) {
        const submissions = assignment.getDataValue('submissions') || [];
        const lesson = assignment.get('lesson') as LessonType | undefined;
        const submittedCount = submissions.length;
        const gradedCount = submissions.filter((s: any) => s.status === 'graded').length;
        const scoredSubmissions = submissions.filter(
          (s: any) => s.score !== null && s.score !== undefined
        );
        const totalScore = scoredSubmissions.reduce(
          (sum: number, s: any) => sum + (s.score || 0),
          0
        );
        const averageScore = scoredSubmissions.length > 0 ? totalScore / scoredSubmissions.length : 0;
        const submissionRate = totalEnrollments > 0 ? (submittedCount / totalEnrollments) * 100 : 0;

        stats.push({
          assignmentId: assignment.id,
          assignmentTitle: lesson?.title || 'Unknown',
          totalStudents: totalEnrollments,
          submittedCount,
          gradedCount,
          submissionRate,
          averageScore,
          dueDate: assignment.dueDate,
        });
      }

      return stats;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch assignment stats', 500);
    }
  }

  async getAllAssignmentsByCourse(courseId: number): Promise<AssignmentType[]> {
    try {
      const course = await Course.findByPk(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const assignments = await Assignment.findAll({
        include: [
          {
            model: Lesson,
            as: 'lesson',
            required: true,
            include: [
              {
                model: Chapter,
                as: 'chapter',
                required: true,
                where: { courseId },
              },
            ],
          },
          {
            model: AssignmentSubmission,
            as: 'submissions',
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return assignments.map((assignment) => ({
        ...(assignment.toJSON() as unknown as AssignmentType),
        _count: {
          submissions: (assignment.getDataValue('submissions') || []).length,
        },
      })) as unknown as AssignmentType[];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch assignments', 500);
    }
  }
}

export default new AssignmentService();
