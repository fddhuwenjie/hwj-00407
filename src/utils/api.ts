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
  Assignment,
  AssignmentSubmission,
  AssignmentStats,
  Note,
  StudyGroup,
  GroupMember,
  GroupDiscussion,
  GroupDiscussionReply,
  GroupGoal,
  GroupMemberProgress,
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

export const createAssignment = (lessonId: number, data: { description: string; dueDate: string; maxScore: number; allowLateSubmission: boolean }) =>
  fetchWrapper<Assignment>(`/lessons/${lessonId}/assignment`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getAssignmentByLesson = (lessonId: number) =>
  fetchWrapper<Assignment>(`/lessons/${lessonId}/assignment`);

export const submitAssignment = (assignmentId: number, content: string) =>
  fetchWrapper<AssignmentSubmission>(`/assignments/${assignmentId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });

export const getAssignmentSubmissions = (assignmentId: number) =>
  fetchWrapper<AssignmentSubmission[]>(`/assignments/${assignmentId}/submissions`);

export const getMyAssignmentSubmission = (assignmentId: number) =>
  fetchWrapper<AssignmentSubmission>(`/assignments/${assignmentId}/my-submission`);

export const gradeAssignment = (assignmentId: number, submissionId: number, score: number, feedback: string) =>
  fetchWrapper<AssignmentSubmission>(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, {
    method: 'POST',
    body: JSON.stringify({ score, feedback }),
  });

export const getAssignmentStats = (courseId: number) =>
  fetchWrapper<AssignmentStats[]>(`/courses/${courseId}/assignments/stats`);

export const createNote = (data: { courseId: number; lessonId: number; content: string; timePoint?: number; tag?: string }) =>
  fetchWrapper<Note>('/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateNote = (noteId: number, data: { content?: string; tag?: string }) =>
  fetchWrapper<Note>(`/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteNote = (noteId: number) =>
  fetchWrapper<{ success: boolean }>(`/notes/${noteId}`, {
    method: 'DELETE',
  });

export const getMyNotes = (filters?: { courseId?: number; tag?: string; search?: string }) => {
  const params = new URLSearchParams();
  if (filters?.courseId) params.append('courseId', String(filters.courseId));
  if (filters?.tag) params.append('tag', filters.tag);
  if (filters?.search) params.append('search', filters.search);
  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchWrapper<Note[]>(`/notes${query}`);
};

export const getLessonNotes = (lessonId: number) =>
  fetchWrapper<Note[]>(`/lessons/${lessonId}/notes`);

export const exportCourseNotes = (courseId: number) =>
  fetchWrapper<{ content: string; filename: string }>(`/notes/export/${courseId}`);

export const createStudyGroup = (data: { name: string; description: string; courseId: number; maxMembers: number }) =>
  fetchWrapper<StudyGroup>('/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getMyStudyGroups = () =>
  fetchWrapper<StudyGroup[]>('/groups/my');

export const getStudyGroupsByCourse = (courseId: number) =>
  fetchWrapper<StudyGroup[]>(`/courses/${courseId}/groups`);

export const getStudyGroupById = (groupId: number) =>
  fetchWrapper<StudyGroup>(`/groups/${groupId}`);

export const joinStudyGroup = (groupId: number) =>
  fetchWrapper<GroupMember>(`/groups/${groupId}/join`, {
    method: 'POST',
  });

export const approveGroupMember = (groupId: number, userId: number) =>
  fetchWrapper<GroupMember>(`/groups/${groupId}/members/${userId}/approve`, {
    method: 'POST',
  });

export const rejectGroupMember = (groupId: number, userId: number) =>
  fetchWrapper<GroupMember>(`/groups/${groupId}/members/${userId}/reject`, {
    method: 'POST',
  });

export const removeGroupMember = (groupId: number, userId: number) =>
  fetchWrapper<{ success: boolean }>(`/groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
  });

export const setGroupWeeklyGoal = (groupId: number, lessonsToComplete: number) =>
  fetchWrapper<GroupGoal>(`/groups/${groupId}/goal`, {
    method: 'POST',
    body: JSON.stringify({ lessonsToComplete }),
  });

export const getGroupProgress = (groupId: number) =>
  fetchWrapper<GroupMemberProgress[]>(`/groups/${groupId}/progress`);

export const getAllGroupsForInstructor = () =>
  fetchWrapper<StudyGroup[]>('/groups/instructor/groups');

export const createGroupDiscussion = (groupId: number, title: string, content: string) =>
  fetchWrapper<GroupDiscussion>(`/groups/${groupId}/discussions`, {
    method: 'POST',
    body: JSON.stringify({ title, content }),
  });

export const getGroupDiscussions = (groupId: number) =>
  fetchWrapper<GroupDiscussion[]>(`/groups/${groupId}/discussions`);

export const createGroupDiscussionReply = (discussionId: number, content: string) =>
  fetchWrapper<GroupDiscussionReply>(`/groups/discussions/${discussionId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
