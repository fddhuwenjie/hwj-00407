import type {
  User,
  Course,
  CourseProgress,
  QuizQuestion,
  Certificate,
  DiscussionPost,
  DiscussionReply,
  DashboardStats,
  DailyEnrollment,
  LessonCompletion,
  StudyTimeDistribution,
  Enrollment,
} from '../../shared/types.js';

const baseURL = '/api';

async function fetchWrapper<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const userId = localStorage.getItem('currentUserId');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (userId) {
    headers['x-user-id'] = userId;
  }

  const response = await fetch(`${baseURL}${endpoint}`, {
    ...options,
    headers,
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || '请求失败');
  }

  return result.data as T;
}

export const getUsers = () => fetchWrapper<User[]>('/users');
export const getUserById = (id: number) => fetchWrapper<User>(`/users/${id}`);

export const getCourses = () => fetchWrapper<Course[]>('/courses');
export const getCourseById = (id: number) => fetchWrapper<Course>(`/courses/${id}`);
export const enrollCourse = (courseId: number) =>
  fetchWrapper<{ success: boolean }>(`/courses/${courseId}/enroll`, { method: 'POST' });

export const getCourseProgress = (courseId: number) =>
  fetchWrapper<CourseProgress>(`/courses/${courseId}/progress`);

export const completeLesson = (lessonId: number, timeSpent: number) =>
  fetchWrapper<{ success: boolean }>(`/lessons/${lessonId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ timeSpent }),
  });

export const getQuiz = (lessonId: number) =>
  fetchWrapper<QuizQuestion[]>(`/lessons/${lessonId}/quiz`);

export const submitQuiz = (lessonId: number, answers: Record<number, number[]>) =>
  fetchWrapper<{ score: number; passed: boolean }>(`/lessons/${lessonId}/quiz`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });

export const verifyCertificate = (number: string) =>
  fetchWrapper<{ valid: boolean; certificate?: Certificate }>(
    `/certificates/verify?number=${encodeURIComponent(number)}`
  );

export const generateCertificate = (courseId: number) =>
  fetchWrapper<Certificate>(`/courses/${courseId}/certificate`, { method: 'POST' });

export const getUserCertificates = (userId: number) =>
  fetchWrapper<Certificate[]>(`/users/${userId}/certificates`);

export const getDiscussionPosts = (courseId: number) =>
  fetchWrapper<DiscussionPost[]>(`/courses/${courseId}/discussions`);

export const createDiscussionPost = (courseId: number, title: string, content: string) =>
  fetchWrapper<DiscussionPost>(`/courses/${courseId}/discussions`, {
    method: 'POST',
    body: JSON.stringify({ title, content }),
  });

export const createDiscussionReply = (postId: number, content: string) =>
  fetchWrapper<DiscussionReply>(`/discussions/${postId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });

export const togglePostFeatured = (postId: number) =>
  fetchWrapper<DiscussionPost>(`/discussions/${postId}/featured`, { method: 'POST' });

export const togglePostPinned = (postId: number) =>
  fetchWrapper<DiscussionPost>(`/discussions/${postId}/pinned`, { method: 'POST' });

export const getDashboardStats = () => fetchWrapper<DashboardStats>('/dashboard/stats');

export const getDailyEnrollments = (courseId: number, days: number) =>
  fetchWrapper<DailyEnrollment[]>(`/dashboard/courses/${courseId}/enrollments?days=${days}`);

export const getLessonCompletion = (courseId: number) =>
  fetchWrapper<LessonCompletion[]>(`/dashboard/courses/${courseId}/completion`);

export const getStudyTimeDistribution = (courseId: number) =>
  fetchWrapper<StudyTimeDistribution[]>(`/dashboard/courses/${courseId}/study-time`);

export const getUserEnrollments = (userId: number) =>
  fetchWrapper<Enrollment[]>(`/users/${userId}/enrollments`);

export const getEnrollmentWithProgress = (userId: number) =>
  fetchWrapper<Array<{ enrollment: Enrollment; progress: CourseProgress }>>(
    `/users/${userId}/enrollments/progress`
  );
