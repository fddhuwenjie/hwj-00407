export type UserRole = 'student' | 'instructor';
export type LessonType = 'video' | 'document' | 'quiz';
export type QuestionType = 'single' | 'multiple' | 'boolean';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  coverImageUrl: string;
  difficulty: CourseDifficulty;
  instructorId: number;
  createdAt: Date;
  instructor?: User;
  chapters?: Chapter[];
  _count?: {
    enrollments: number;
  };
}

export interface Chapter {
  id: number;
  courseId: number;
  title: string;
  order: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: number;
  chapterId: number;
  title: string;
  type: LessonType;
  content: string;
  order: number;
  duration?: number;
  chapter?: Chapter;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: number;
  lessonId: number;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswers: number[];
  explanation: string;
  order: number;
}

export interface Enrollment {
  id: number;
  userId: number;
  courseId: number;
  enrolledAt: Date;
  course?: Course;
  user?: User;
}

export interface LearningProgress {
  id: number;
  userId: number;
  courseId: number;
  lessonId: number;
  completed: boolean;
  completedAt?: Date;
  timeSpent: number;
  lesson?: Lesson;
}

export interface QuizAttempt {
  id: number;
  userId: number;
  lessonId: number;
  score: number;
  answers: Record<number, number[]>;
  createdAt: Date;
  isHighest?: boolean;
}

export interface Certificate {
  id: number;
  userId: number;
  courseId: number;
  certificateNumber: string;
  issuedAt: Date;
  user?: User;
  course?: Course;
}

export interface DiscussionPost {
  id: number;
  courseId: number;
  userId: number;
  title: string;
  content: string;
  isPinned: boolean;
  isFeatured: boolean;
  createdAt: Date;
  user?: User;
  replies?: DiscussionReply[];
  _count?: {
    replies: number;
  };
}

export interface DiscussionReply {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: Date;
  user?: User;
}

export interface CourseProgress {
  courseId: number;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  totalTimeSpent: number;
  lessons: {
    lessonId: number;
    completed: boolean;
    timeSpent: number;
    unlocked: boolean;
  }[];
}

export interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  averageCompletionRate: number;
  averageQuizScore: number;
  discussionHeat: number;
}

export interface DailyEnrollment {
  date: string;
  count: number;
}

export interface LessonCompletion {
  lessonId: number;
  lessonTitle: string;
  completionRate: number;
  totalStudents: number;
  completedStudents: number;
}

export interface StudyTimeDistribution {
  range: string;
  count: number;
}
