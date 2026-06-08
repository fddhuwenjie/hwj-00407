import { QuizQuestion, QuizAttempt, Lesson } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type { QuizQuestion as QuizQuestionType, QuizAttempt as QuizAttemptType } from '../../../shared/types.js';

interface QuizQuestionWithoutAnswer {
  id: number;
  lessonId: number;
  type: 'single' | 'multiple' | 'boolean';
  question: string;
  options: string[];
  order: number;
}

interface QuizSubmitResult {
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
}

class QuizService {
  async getQuizQuestions(lessonId: number): Promise<QuizQuestionWithoutAnswer[]> {
    try {
      const lesson = await Lesson.findByPk(lessonId);
      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      if (lesson.type !== 'quiz') {
        throw new AppError('This lesson is not a quiz', 400);
      }

      const questions = await QuizQuestion.findAll({
        where: { lessonId },
        order: [['order', 'ASC']],
      });

      return questions.map(q => ({
        id: q.id,
        lessonId: q.lessonId,
        type: q.type,
        question: q.question,
        options: q.options as unknown as string[],
        order: q.order,
      }));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch quiz questions', 500);
    }
  }

  async submitQuiz(
    userId: number,
    lessonId: number,
    answers: Record<number, number[]>
  ): Promise<QuizSubmitResult> {
    try {
      const lesson = await Lesson.findByPk(lessonId);
      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      if (lesson.type !== 'quiz') {
        throw new AppError('This lesson is not a quiz', 400);
      }

      const questions = await QuizQuestion.findAll({
        where: { lessonId },
        order: [['order', 'ASC']],
      });

      if (questions.length === 0) {
        throw new AppError('No questions found for this quiz', 400);
      }

      let correctCount = 0;

      for (const question of questions) {
        const userAnswer = answers[question.id];
        const correctAnswers = question.correctAnswers as unknown as number[];

        if (!userAnswer) {
          continue;
        }

        const sortedUserAnswer = [...userAnswer].sort();
        const sortedCorrectAnswer = [...correctAnswers].sort();

        if (
          sortedUserAnswer.length === sortedCorrectAnswer.length &&
          sortedUserAnswer.every((val, idx) => val === sortedCorrectAnswer[idx])
        ) {
          correctCount++;
        }
      }

      const score = Math.round((correctCount / questions.length) * 100);
      const passed = score >= 80;

      await QuizAttempt.create({
        userId,
        lessonId,
        score,
        answers,
        createdAt: new Date(),
      });

      return {
        score,
        passed,
        correctCount,
        totalQuestions: questions.length,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to submit quiz', 500);
    }
  }

  async getHighestScore(userId: number, lessonId: number): Promise<number | null> {
    try {
      const highest = await QuizAttempt.findOne({
        where: { userId, lessonId },
        order: [['score', 'DESC']],
        attributes: ['score'],
      });

      return highest ? highest.score : null;
    } catch (error) {
      throw new AppError('Failed to fetch highest score', 500);
    }
  }

  async getAllAttempts(userId: number, lessonId: number): Promise<QuizAttemptType[]> {
    try {
      const attempts = await QuizAttempt.findAll({
        where: { userId, lessonId },
        order: [['createdAt', 'DESC']],
      });

      return attempts.map(attempt => {
        const attemptJson = attempt.toJSON();
        const isHighest = attempts[0].id === attempt.id;
        return {
          ...attemptJson,
          answers: attemptJson.answers,
          isHighest,
        } as QuizAttemptType;
      });
    } catch (error) {
      throw new AppError('Failed to fetch quiz attempts', 500);
    }
  }
}

export default new QuizService();
