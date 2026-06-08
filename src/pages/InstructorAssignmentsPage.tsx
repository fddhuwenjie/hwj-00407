import { useState, useEffect } from 'react';
import {
  ClipboardList,
  Users,
  Award,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Edit,
  Plus,
  X,
  Loader2,
  FileText,
  Calendar,
  Maximize2,
  Eye,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCourseStore } from '@/store/useCourseStore';
import {
  getAssignmentStats,
  getAssignmentSubmissions,
  gradeAssignment,
  createAssignment,
  getCourseById,
} from '@/utils/api';
import { cn } from '@/lib/utils';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import type {
  AssignmentStats,
  AssignmentSubmission,
  Course,
  Lesson,
  User,
} from '../../shared/types.js';

interface GradeModalState {
  open: boolean;
  submission: AssignmentSubmission | null;
  assignmentId: number | null;
}

interface CreateModalState {
  open: boolean;
  course: Course | null;
}

interface NewAssignmentForm {
  lessonId: number | null;
  description: string;
  dueDate: string;
  maxScore: number;
  allowLateSubmission: boolean;
}

interface GradeForm {
  score: string;
  feedback: string;
}

export default function InstructorAssignmentsPage() {
  const { currentUser } = useAuthStore();
  const { courses, fetchCourses } = useCourseStore();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [assignmentStats, setAssignmentStats] = useState<AssignmentStats[]>([]);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<number | null>(null);
  const [submissionsMap, setSubmissionsMap] = useState<Map<number, AssignmentSubmission[]>>(new Map());
  const [courseDetailsMap, setCourseDetailsMap] = useState<Map<number, Course>>(new Map());
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState<Set<number>>(new Set());
  const [gradingModal, setGradingModal] = useState<GradeModalState>({
    open: false,
    submission: null,
    assignmentId: null,
  });
  const [createModal, setCreateModal] = useState<CreateModalState>({
    open: false,
    course: null,
  });
  const [newAssignment, setNewAssignment] = useState<NewAssignmentForm>({
    lessonId: null,
    description: '',
    dueDate: '',
    maxScore: 100,
    allowLateSubmission: false,
  });
  const [gradeForm, setGradeForm] = useState<GradeForm>({
    score: '',
    feedback: '',
  });
  const [savingGrade, setSavingGrade] = useState(false);
  const [creatingAssignment, setCreatingAssignment] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const instructorCourses = courses.filter((c) => c.instructorId === currentUser?.id);
    if (instructorCourses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(instructorCourses[0].id);
    }
  }, [courses, currentUser]);

  useEffect(() => {
    if (selectedCourseId) {
      loadAssignmentStats(selectedCourseId);
      loadCourseDetails(selectedCourseId);
    }
  }, [selectedCourseId]);

  const loadInitialData = async () => {
    await fetchCourses();
  };

  const loadAssignmentStats = async (courseId: number) => {
    setLoadingStats(true);
    try {
      const stats = await getAssignmentStats(courseId);
      setAssignmentStats(stats);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadCourseDetails = async (courseId: number) => {
    if (!courseDetailsMap.has(courseId)) {
      const course = await getCourseById(courseId);
      setCourseDetailsMap((prev) => new Map(prev).set(courseId, course));
    }
  };

  const loadSubmissions = async (assignmentId: number) => {
    if (submissionsMap.has(assignmentId)) return;

    setLoadingSubmissions((prev) => new Set(prev).add(assignmentId));
    try {
      const submissions = await getAssignmentSubmissions(assignmentId);
      setSubmissionsMap((prev) => new Map(prev).set(assignmentId, submissions));
    } finally {
      setLoadingSubmissions((prev) => {
        const next = new Set(prev);
        next.delete(assignmentId);
        return next;
      });
    }
  };

  const toggleExpand = async (assignmentId: number) => {
    if (expandedAssignmentId === assignmentId) {
      setExpandedAssignmentId(null);
    } else {
      setExpandedAssignmentId(assignmentId);
      await loadSubmissions(assignmentId);
    }
  };

  const openGradeModal = (submission: AssignmentSubmission, assignmentId: number) => {
    setGradeForm({
      score: submission.score?.toString() || '',
      feedback: submission.feedback || '',
    });
    setGradingModal({
      open: true,
      submission,
      assignmentId,
    });
  };

  const closeGradeModal = () => {
    setGradingModal({
      open: false,
      submission: null,
      assignmentId: null,
    });
    setGradeForm({ score: '', feedback: '' });
  };

  const handleGradeSubmit = async () => {
    if (!gradingModal.assignmentId || !gradingModal.submission) return;

    const score = parseFloat(gradeForm.score);
    if (isNaN(score) || score < 0) return;

    setSavingGrade(true);
    try {
      const updatedSubmission = await gradeAssignment(
        gradingModal.assignmentId,
        gradingModal.submission.id,
        score,
        gradeForm.feedback
      );

      setSubmissionsMap((prev) => {
        const submissions = prev.get(gradingModal.assignmentId!);
        if (!submissions) return prev;
        const updated = submissions.map((s) =>
          s.id === updatedSubmission.id ? updatedSubmission : s
        );
        return new Map(prev).set(gradingModal.assignmentId!, updated);
      });

      if (selectedCourseId) {
        await loadAssignmentStats(selectedCourseId);
      }

      closeGradeModal();
    } finally {
      setSavingGrade(false);
    }
  };

  const openCreateModal = async () => {
    if (!selectedCourseId) return;
    await loadCourseDetails(selectedCourseId);
    const course = courseDetailsMap.get(selectedCourseId) || null;
    setCreateModal({
      open: true,
      course,
    });
    setNewAssignment({
      lessonId: null,
      description: '',
      dueDate: '',
      maxScore: 100,
      allowLateSubmission: false,
    });
    setShowPreview(false);
  };

  const closeCreateModal = () => {
    setCreateModal({
      open: false,
      course: null,
    });
    setNewAssignment({
      lessonId: null,
      description: '',
      dueDate: '',
      maxScore: 100,
      allowLateSubmission: false,
    });
    setShowPreview(false);
  };

  const handleCreateAssignment = async () => {
    if (!newAssignment.lessonId || !newAssignment.description || !newAssignment.dueDate) return;

    setCreatingAssignment(true);
    try {
      await createAssignment(newAssignment.lessonId, {
        description: newAssignment.description,
        dueDate: newAssignment.dueDate,
        maxScore: newAssignment.maxScore,
        allowLateSubmission: newAssignment.allowLateSubmission,
      });

      if (selectedCourseId) {
        await loadAssignmentStats(selectedCourseId);
      }

      closeCreateModal();
    } finally {
      setCreatingAssignment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      submitted: 'bg-blue-100 text-blue-700',
      graded: 'bg-teal-100 text-teal-700',
      late: 'bg-amber-100 text-amber-700',
      not_submitted: 'bg-gray-100 text-gray-600',
    };

    const labels: Record<string, string> = {
      submitted: '已提交',
      graded: '已批改',
      late: '迟交',
      not_submitted: '未提交',
    };

    return (
      <span
        className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          styles[status] || styles.not_submitted
        )}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const instructorCourses = courses.filter((c) => c.instructorId === currentUser?.id);
  const submissions = expandedAssignmentId ? submissionsMap.get(expandedAssignmentId) || [] : [];
  const allLessons: Lesson[] = [];

  if (createModal.course?.chapters) {
    for (const chapter of createModal.course.chapters) {
      if (chapter.lessons) {
        allLessons.push(...chapter.lessons);
      }
    }
  }

  if (currentUser?.role !== 'instructor') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <ClipboardList className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900">无访问权限</h2>
        <p className="text-gray-500">该页面仅对讲师开放</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">作业管理</h1>
          <p className="text-gray-500">查看和批改学员作业</p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={!selectedCourseId}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors',
            selectedCourseId
              ? 'bg-blue-800 text-white hover:bg-blue-900'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}>
          <Plus className="w-5 h-5" />
          创建作业
        </button>
      </div>

      {instructorCourses.length > 1 && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">选择课程：</span>
          <select
            value={selectedCourseId || ''}
            onChange={(e) => setSelectedCourseId(Number(e.target.value))}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent">
            {instructorCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loadingStats ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-800 animate-spin" />
          </div>
        ) : assignmentStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <ClipboardList className="w-16 h-16 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700">暂无作业</h3>
            <p className="text-gray-500">点击右上角按钮创建第一个作业</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="w-12 py-4 px-4"></th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    作业名称
                  </div>
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    截止日期
                  </div>
                </th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-4 h-4" />
                    总学员数
                  </div>
                </th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    已提交 / 提交率
                  </div>
                </th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <Award className="w-4 h-4" />
                    已批改
                  </div>
                </th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <Maximize2 className="w-4 h-4" />
                    平均分
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {assignmentStats.map((stat) => {
                const isExpanded = expandedAssignmentId === stat.assignmentId;
                const isOverdue = new Date() > new Date(stat.dueDate);

                return (
                  <>
                    <tr
                      key={stat.assignmentId}
                      onClick={() => toggleExpand(stat.assignmentId)}
                      className={cn(
                        'border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50',
                        isExpanded && 'bg-blue-50/50'
                      )}>
                      <td className="py-4 px-4">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {stat.assignmentTitle}
                          </span>
                          {isOverdue && (
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-600 text-sm">
                          {formatDate(stat.dueDate)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-gray-900">
                          {stat.totalStudents}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full transition-all duration-500"
                              style={{ width: `${stat.submissionRate}%` }}
                            />
                          </div>
                          <span className="text-sm">
                            <span className="font-semibold text-teal-600">
                              {stat.submittedCount}
                            </span>
                            <span className="text-gray-400"> / </span>
                            <span className="text-gray-600">
                              {Math.round(stat.submissionRate)}%
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={cn(
                            'font-semibold',
                            stat.gradedCount < stat.submittedCount
                              ? 'text-amber-600'
                              : 'text-teal-600'
                          )}>
                          {stat.gradedCount}
                          {stat.submittedCount > 0 && (
                            <span className="text-gray-400 font-normal">
                              {' '}
                              ({Math.round((stat.gradedCount / stat.submittedCount) * 100)}%)
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-gray-900">
                          {stat.averageScore >= 0
                            ? `${Math.round(stat.averageScore)}分`
                            : '-'}
                        </span>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="py-0">
                          <div className="p-4 border-t border-gray-200">
                            {loadingSubmissions.has(stat.assignmentId) ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-blue-800 animate-spin" />
                              </div>
                            ) : submissions.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                暂无提交记录
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-700 mb-4">
                                  提交列表（{submissions.length}）
                                </h4>
                                {submissions.map((submission) => (
                                  <div
                                    key={submission.id}
                                    className="bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                      <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                          <span className="font-semibold text-gray-600">
                                            {(submission.user as User)?.name?.[0] || '?'}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-900">
                                            {(submission.user as User)?.name || '未知学员'}
                                          </p>
                                          <p className="text-sm text-gray-500">
                                            提交时间：{formatDate(submission.submittedAt)}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        {getStatusBadge(submission.status)}
                                        {submission.score !== undefined && (
                                          <div className="text-right">
                                            <p className="font-bold text-teal-600">
                                              {submission.score}分
                                            </p>
                                          </div>
                                        )}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openGradeModal(submission, stat.assignmentId);
                                          }}
                                          className={cn(
                                            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                            submission.status === 'graded'
                                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                              : 'bg-blue-800 text-white hover:bg-blue-900'
                                          )}>
                                          {submission.status === 'graded' ? (
                                            <>
                                              <Edit className="w-4 h-4" />
                                              重新批改
                                            </>
                                          ) : (
                                            <>
                                              <Award className="w-4 h-4" />
                                              批改
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                    {submission.content && (
                                      <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                          作业内容：
                                        </p>
                                        <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                                          <MarkdownRenderer content={submission.content} />
                                        </div>
                                      </div>
                                    )}
                                    {submission.feedback && (
                                      <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                          评语：
                                        </p>
                                        <div className="bg-blue-50 rounded-lg p-3 text-gray-700 text-sm">
                                          {submission.feedback}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {gradingModal.open && gradingModal.submission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">批改作业</h3>
              <button
                onClick={closeGradeModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">学员</p>
                <p className="font-medium text-gray-900">
                  {(gradingModal.submission.user as User)?.name || '未知学员'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">作业内容</p>
                <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                  <MarkdownRenderer content={gradingModal.submission.content} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分数
                </label>
                <input
                  type="number"
                  value={gradeForm.score}
                  onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                  placeholder="请输入分数"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  评语
                </label>
                <textarea
                  value={gradeForm.feedback}
                  onChange={(e) =>
                    setGradeForm({ ...gradeForm, feedback: e.target.value })
                  }
                  placeholder="请输入评语..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={closeGradeModal}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                取消
              </button>
              <button
                onClick={handleGradeSubmit}
                disabled={savingGrade || !gradeForm.score}
                className={cn(
                  'flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-colors',
                  savingGrade || !gradeForm.score
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-800 text-white hover:bg-blue-900'
                )}>
                {savingGrade ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '保存批改'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {createModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">创建作业</h3>
              <button
                onClick={closeCreateModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择课时
                </label>
                <select
                  value={newAssignment.lessonId || ''}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      lessonId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent">
                  <option value="">请选择课时</option>
                  {allLessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    题目描述
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-1 text-sm text-blue-800 hover:text-blue-900">
                    <Eye className="w-4 h-4" />
                    {showPreview ? '编辑' : '预览'}
                  </button>
                </div>
                {showPreview ? (
                  <div className="border border-gray-200 rounded-xl p-4 min-h-[200px] bg-gray-50">
                    {newAssignment.description ? (
                      <MarkdownRenderer content={newAssignment.description} />
                    ) : (
                      <p className="text-gray-400 text-center py-8">暂无内容</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={newAssignment.description}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        description: e.target.value,
                      })
                    }
                    placeholder="请输入作业描述，支持 Markdown 格式..."
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent resize-none font-mono text-sm"
                  />
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    截止日期
                  </label>
                  <input
                    type="datetime-local"
                    value={newAssignment.dueDate}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        dueDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    满分分值
                  </label>
                  <input
                    type="number"
                    value={newAssignment.maxScore}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        maxScore: Number(e.target.value) || 0,
                      })
                    }
                    min="1"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">允许迟交</p>
                  <p className="text-sm text-gray-500">开启后学员可在截止日期后提交</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNewAssignment({
                      ...newAssignment,
                      allowLateSubmission: !newAssignment.allowLateSubmission,
                    })
                  }
                  className={cn(
                    'relative w-14 h-8 rounded-full transition-colors',
                    newAssignment.allowLateSubmission ? 'bg-blue-800' : 'bg-gray-300'
                  )}>
                  <span
                    className={cn(
                      'absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform',
                      newAssignment.allowLateSubmission
                        ? 'translate-x-7'
                        : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={closeCreateModal}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                取消
              </button>
              <button
                onClick={handleCreateAssignment}
                disabled={
                  creatingAssignment ||
                  !newAssignment.lessonId ||
                  !newAssignment.description ||
                  !newAssignment.dueDate
                }
                className={cn(
                  'flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-colors',
                  creatingAssignment ||
                  !newAssignment.lessonId ||
                  !newAssignment.description ||
                  !newAssignment.dueDate
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-800 text-white hover:bg-blue-900'
                )}>
                {creatingAssignment ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    创建作业
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
