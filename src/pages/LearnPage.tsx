import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PlayCircle,
  FileText,
  HelpCircle,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Trophy,
  AlertCircle,
  BookOpen,
  RotateCcw,
  ClipboardList,
  Send,
  Star,
  PenLine,
  StickyNote,
  MessageSquare,
  Edit3,
} from 'lucide-react';
import { useCourseStore } from '@/store/useCourseStore';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import QuizQuestion from '@/components/QuizQuestion';
import { cn } from '@/lib/utils';
import {
  getQuiz,
  submitQuiz,
  completeLesson,
  getAssignmentByLesson,
  submitAssignment,
  getMyAssignmentSubmission,
  getLessonNotes,
  createNote,
} from '@/utils/api';
import type {
  Lesson,
  Chapter,
  QuizQuestion as QuizQuestionType,
  LessonType,
  Assignment,
  AssignmentSubmission,
  Note,
  NoteTag,
} from '../../shared/types.js';

const lessonTypeIcons: Record<LessonType, React.ElementType> = {
  video: PlayCircle,
  document: FileText,
  quiz: HelpCircle,
  assignment: ClipboardList,
};

const lessonTypeLabels: Record<LessonType, string> = {
  video: '视频',
  document: '文档',
  quiz: '测验',
  assignment: '作业',
};

interface FlattenedLesson {
  lesson: Lesson;
  chapter: Chapter;
}

export default function LearnPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { currentCourse, currentProgress, loading, fetchCourseById, fetchProgress, clearCurrentCourse } = useCourseStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [studyTime, setStudyTime] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionType[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number[]>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizHighestScore, setQuizHighestScore] = useState<number | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [showNotePanel, setShowNotePanel] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [mySubmission, setMySubmission] = useState<AssignmentSubmission | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [lessonNotes, setLessonNotes] = useState<Note[]>([]);
  const [noteContent, setNoteContent] = useState('');
  const [noteTag, setNoteTag] = useState<NoteTag>('normal');
  const [addingNote, setAddingNote] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (courseId) {
      fetchCourseById(Number(courseId));
      fetchProgress(Number(courseId));
    }
    return () => clearCurrentCourse();
  }, [courseId, fetchCourseById, fetchProgress, clearCurrentCourse]);

  const loadQuiz = async (lessonIdNum: number) => {
    setQuizLoading(true);
    try {
      const questions = await getQuiz(lessonIdNum);
      setQuizQuestions(questions);
    } finally {
      setQuizLoading(false);
    }
  };

  const loadAssignment = async (lessonIdNum: number) => {
    setAssignmentLoading(true);
    try {
      const assignmentData = await getAssignmentByLesson(lessonIdNum);
      setAssignment(assignmentData);
      try {
        const submissionData = await getMyAssignmentSubmission(assignmentData.id);
        setMySubmission(submissionData);
        setSubmissionContent(submissionData.content);
      } catch {
        setMySubmission(null);
        setSubmissionContent('');
      }
    } catch {
      setAssignment(null);
      setMySubmission(null);
    } finally {
      setAssignmentLoading(false);
    }
  };

  const loadNotes = async (lessonIdNum: number) => {
    setNotesLoading(true);
    try {
      const notes = await getLessonNotes(lessonIdNum);
      setLessonNotes(notes);
    } catch {
      setLessonNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  const flattenedLessons: FlattenedLesson[] = [];
  if (currentCourse?.chapters) {
    const sortedChapters = [...currentCourse.chapters].sort((a, b) => a.order - b.order);
    for (const chapter of sortedChapters) {
      const sortedLessons = [...(chapter.lessons || [])].sort((a, b) => a.order - b.order);
      for (const lesson of sortedLessons) {
        flattenedLessons.push({ lesson, chapter });
      }
    }
  }

  const currentIndex = flattenedLessons.findIndex(
    (fl) => fl.lesson.id === Number(lessonId)
  );
  const currentLesson = currentIndex >= 0 ? flattenedLessons[currentIndex].lesson : null;
  const currentChapter = currentIndex >= 0 ? flattenedLessons[currentIndex].chapter : null;
  const prevLesson = currentIndex > 0 ? flattenedLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < flattenedLessons.length - 1
    ? flattenedLessons[currentIndex + 1]
    : null;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setStudyTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (currentLesson?.type === 'quiz' && lessonId) {
      loadQuiz(Number(lessonId));
      setAssignment(null);
      setMySubmission(null);
    } else if (currentLesson?.type === 'assignment' && lessonId) {
      loadAssignment(Number(lessonId));
      setQuizQuestions([]);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
    } else {
      setQuizQuestions([]);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
      setAssignment(null);
      setMySubmission(null);
    }
  }, [lessonId, currentLesson?.type]);

  useEffect(() => {
    if (lessonId) {
      loadNotes(Number(lessonId));
    }
  }, [lessonId]);

  const getLessonStatus = (lessonIdNum: number) => {
    if (!currentProgress) return { completed: false, unlocked: true };
    const lessonProgress = currentProgress.lessons.find((l) => l.lessonId === lessonIdNum);
    return {
      completed: lessonProgress?.completed || false,
      unlocked: lessonProgress?.unlocked || true,
    };
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLessonClick = (lessonIdNum: number, unlocked: boolean) => {
    if (!courseId || !unlocked) return;
    navigate(`/courses/${courseId}/learn/${lessonIdNum}`);
  };

  const handlePrevLesson = () => {
    if (prevLesson) {
      handleLessonClick(prevLesson.lesson.id, true);
    }
  };

  const handleNextLesson = () => {
    if (nextLesson) {
      const status = getLessonStatus(nextLesson.lesson.id);
      handleLessonClick(nextLesson.lesson.id, status.unlocked);
    }
  };

  const handleQuizAnswer = (questionId: number, answers: number[]) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: answers }));
  };

  const handleSubmitQuiz = async () => {
    if (!lessonId || quizSubmitted) return;
    setQuizLoading(true);
    try {
      const result = await submitQuiz(Number(lessonId), quizAnswers);
      setQuizScore(result.score);
      setQuizPassed(result.passed);
      setQuizSubmitted(true);
      if (result.passed) {
        setQuizHighestScore((prev) => (prev === null ? result.score : Math.max(prev, result.score)));
        const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
        await completeLesson(Number(lessonId), timeSpent);
        await fetchProgress(Number(courseId));
      }
    } finally {
      setQuizLoading(false);
    }
  };

  const handleRetryQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizPassed(false);
    startTimeRef.current = Date.now();
    setStudyTime(0);
  };

  const handleMarkComplete = async () => {
    if (!lessonId || !currentLesson || currentLesson.type === 'quiz') return;
    if (currentLesson.type === 'assignment') {
      if (!mySubmission || mySubmission.status !== 'graded' || (mySubmission.score ?? 0) < 60) {
        return;
      }
    }
    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
    await completeLesson(Number(lessonId), timeSpent);
    await fetchProgress(Number(courseId));
  };

  const handleSubmitAssignment = async () => {
    if (!assignment || !submissionContent.trim() || submittingAssignment) return;
    setSubmittingAssignment(true);
    try {
      const result = await submitAssignment(assignment.id, submissionContent.trim());
      setMySubmission(result);
      await loadAssignment(Number(lessonId));
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleCreateNote = async () => {
    if (!courseId || !lessonId || !noteContent.trim() || addingNote) return;
    setAddingNote(true);
    try {
      await createNote({
        courseId: Number(courseId),
        lessonId: Number(lessonId),
        content: noteContent.trim(),
        tag: noteTag,
      });
      setNoteContent('');
      setNoteTag('normal');
      await loadNotes(Number(lessonId));
    } finally {
      setAddingNote(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      not_submitted: { label: '未提交', className: 'bg-gray-100 text-gray-600' },
      submitted: { label: '已提交', className: 'bg-blue-100 text-blue-700' },
      graded: { label: '已批改', className: 'bg-teal-100 text-teal-700' },
      late: { label: '迟交', className: 'bg-amber-100 text-amber-700' },
    };
    return badges[status] || badges.not_submitted;
  };

  const getNoteTagBadge = (tag: NoteTag) => {
    const badges: Record<NoteTag, { label: string; className: string; icon: React.ElementType }> = {
      normal: { label: '普通', className: 'bg-gray-100 text-gray-600', icon: StickyNote },
      important: { label: '重点', className: 'bg-amber-100 text-amber-700', icon: Star },
      question: { label: '疑问', className: 'bg-purple-100 text-purple-700', icon: HelpCircle },
    };
    return badges[tag];
  };

  const canMarkComplete = () => {
    if (currentLesson?.type === 'assignment') {
      return mySubmission?.status === 'graded' && (mySubmission.score ?? 0) >= 60;
    }
    return true;
  };

  const progressPercentage = currentProgress?.progressPercentage || 0;
  const totalLessons = currentProgress?.totalLessons || 0;
  const completedLessons = currentProgress?.completedLessons || 0;
  const currentLessonStatus = currentLesson ? getLessonStatus(currentLesson.id) : { completed: false, unlocked: true };
  const canGoNext = nextLesson && (getLessonStatus(nextLesson.lesson.id).unlocked ||
    (currentLessonStatus.completed || (currentLesson?.type === 'quiz' ? quizPassed : canMarkComplete())));

  if (loading && !currentCourse) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-800 animate-spin" />
      </div>
    );
  }

  if (!currentCourse || !currentLesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <BookOpen className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900">课时不存在</h2>
        <button
          onClick={() => navigate(courseId ? `/courses/${courseId}` : '/')}
          className="px-6 py-2 bg-blue-800 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          返回课程
        </button>
      </div>
    );
  }

  const sortedChapters = [...currentCourse.chapters!].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className={cn('w-5 h-5 transition-transform', sidebarOpen && 'rotate-180')} />
            </button>
            <div>
              <div className="text-sm text-gray-500">{currentChapter?.title}</div>
              <h1 className="text-lg font-bold text-gray-900">{currentLesson.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="font-mono font-semibold text-gray-700">{formatTime(studyTime)}</span>
            </div>

            <button
              onClick={() => setShowNotePanel(!showNotePanel)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl transition-colors',
                showNotePanel
                  ? 'bg-blue-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <StickyNote className="w-5 h-5" />
              <span className="hidden sm:inline">笔记</span>
              {lessonNotes.length > 0 && (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  showNotePanel ? 'bg-white/20' : 'bg-blue-100 text-blue-700'
                )}>
                  {lessonNotes.length}
                </span>
              )}
            </button>

            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
              <span>{completedLessons}/{totalLessons}</span>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="font-semibold">{Math.round(progressPercentage)}%</span>
            </div>

            <button
              onClick={handlePrevLesson}
              disabled={!prevLesson}
              className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">上一课</span>
            </button>

            <button
              onClick={handleNextLesson}
              disabled={!canGoNext}
              className="flex items-center gap-1 px-4 py-2 bg-blue-800 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <span className="hidden sm:inline">下一课</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <aside
          className={cn(
            'bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300',
            sidebarOpen ? 'w-80' : 'w-0 lg:w-80',
            !sidebarOpen && 'lg:block hidden'
          )}
        >
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">课程目录</h3>
          </div>
          <div className="p-2 overflow-y-auto max-h-full">
            {sortedChapters.map((chapter) => {
              const sortedLessons = [...(chapter.lessons || [])].sort((a, b) => a.order - b.order);
              return (
                <div key={chapter.id} className="mb-4 last:mb-0">
                  <div className="px-3 py-2 text-sm font-semibold text-gray-500">
                    {chapter.title}
                  </div>
                  <div className="space-y-1">
                    {sortedLessons.map((lesson) => {
                      const Icon = lessonTypeIcons[lesson.type];
                      const status = getLessonStatus(lesson.id);
                      const isActive = lesson.id === currentLesson.id;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonClick(lesson.id, status.unlocked)}
                          disabled={!status.unlocked}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left',
                            isActive && 'bg-blue-50 border-2 border-blue-800',
                            !isActive && status.unlocked && 'hover:bg-gray-50',
                            !status.unlocked && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                            {status.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-teal-600" />
                            ) : !status.unlocked ? (
                              <Lock className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Icon className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {lessonTypeLabels[lesson.type]}
                              </span>
                              <span
                                className={cn(
                                  'text-sm font-medium truncate',
                                  isActive ? 'text-blue-800' : 'text-gray-700'
                                )}
                              >
                                {lesson.title}
                              </span>
                            </div>
                          </div>
                          {lesson.duration && (
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {lesson.duration}分
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          {currentLesson.type === 'video' && (
            <div className="flex-1 flex flex-col">
              <div className="aspect-video bg-black">
                <video
                  className="w-full h-full"
                  controls
                  src={currentLesson.content}
                  poster={currentCourse.coverImageUrl}
                />
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{currentLesson.title}</h2>
                  {!currentLessonStatus.completed && (
                    <button
                      onClick={handleMarkComplete}
                      className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      标记完成
                    </button>
                  )}
                  {currentLessonStatus.completed && (
                    <span className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 font-semibold rounded-xl">
                      <CheckCircle2 className="w-5 h-5" />
                      已完成
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentLesson.type === 'document' && (
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{currentLesson.title}</h2>
                {!currentLessonStatus.completed && (
                  <button
                    onClick={handleMarkComplete}
                    className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    标记完成
                  </button>
                )}
                {currentLessonStatus.completed && (
                  <span className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 font-semibold rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                    已完成
                  </span>
                )}
              </div>
              <MarkdownRenderer content={currentLesson.content} />
            </div>
          )}

          {currentLesson.type === 'quiz' && (
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
              <div className="mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                        测验
                      </span>
                      {quizHighestScore !== null && (
                        <span className="px-3 py-1 bg-teal-100 text-teal-700 text-sm font-medium rounded-full flex items-center gap-1">
                          <Trophy className="w-4 h-4" />
                          最高分: {quizHighestScore}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{currentLesson.title}</h2>
                    <p className="text-gray-500 mt-1">
                      共 {quizQuestions.length} 道题目，80分及格
                    </p>
                  </div>

                  {quizSubmitted && (
                    <div className={cn(
                      'flex items-center gap-3 p-4 rounded-xl',
                      quizPassed ? 'bg-teal-50 border border-teal-200' : 'bg-red-50 border border-red-200'
                    )}>
                      {quizPassed ? (
                        <>
                          <Trophy className="w-8 h-8 text-teal-600" />
                          <div>
                            <div className="text-2xl font-bold text-teal-700">{quizScore}分</div>
                            <div className="text-sm text-teal-600">恭喜通过!</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-8 h-8 text-red-600" />
                          <div>
                            <div className="text-2xl font-bold text-red-700">{quizScore}分</div>
                            <div className="text-sm text-red-600">未通过，请重试</div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {quizLoading && !quizQuestions.length ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-blue-800 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    {quizQuestions.map((question, index) => (
                      <div key={question.id} className="relative">
                        <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-blue-800 flex items-center justify-center text-white text-xs font-bold -translate-y-1">
                          {index + 1}
                        </div>
                        <QuizQuestion
                          question={question}
                          onSubmit={(answers) => handleQuizAnswer(question.id, answers)}
                          submitted={quizSubmitted}
                          userAnswers={quizAnswers[question.id]}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex justify-end gap-4">
                    {quizSubmitted && !quizPassed && (
                      <button
                        onClick={handleRetryQuiz}
                        className="flex items-center gap-2 px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        <RotateCcw className="w-5 h-5" />
                        重新测验
                      </button>
                    )}
                    {!quizSubmitted && (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={quizLoading || Object.keys(quizAnswers).length !== quizQuestions.length}
                        className="flex items-center gap-2 px-8 py-3 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {quizLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          '提交答案'
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {currentLesson.type === 'assignment' && (
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
              {assignmentLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-blue-800 animate-spin" />
                </div>
              ) : assignment ? (
                <>
                  <div className="mb-8">
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full flex items-center gap-1">
                            <ClipboardList className="w-4 h-4" />
                            作业
                          </span>
                          <span className={cn(
                            'px-3 py-1 text-sm font-medium rounded-full',
                            getStatusBadge(mySubmission?.status || 'not_submitted').className
                          )}>
                            {getStatusBadge(mySubmission?.status || 'not_submitted').label}
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{currentLesson.title}</h2>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>截止: {formatDate(assignment.dueDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Trophy className="w-4 h-4" />
                          <span>满分: {assignment.maxScore}分</span>
                        </div>
                        {assignment.allowLateSubmission && (
                          <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded">
                            允许迟交
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <PenLine className="w-5 h-5 text-blue-800" />
                        作业描述
                      </h3>
                      <MarkdownRenderer content={assignment.description} />
                    </div>

                    {mySubmission?.status === 'graded' && (
                      <div className={cn(
                        'p-6 rounded-xl mb-6',
                        (mySubmission.score ?? 0) >= 60
                          ? 'bg-teal-50 border border-teal-200'
                          : 'bg-red-50 border border-red-200'
                      )}>
                        <div className="flex items-center gap-3 mb-4">
                          {(mySubmission.score ?? 0) >= 60 ? (
                            <Trophy className="w-8 h-8 text-teal-600" />
                          ) : (
                            <AlertCircle className="w-8 h-8 text-red-600" />
                          )}
                          <div>
                            <div className="text-2xl font-bold">
                              <span className={(mySubmission.score ?? 0) >= 60 ? 'text-teal-700' : 'text-red-700'}>
                                {mySubmission.score}分
                              </span>
                              <span className="text-gray-500 text-lg ml-2">/ {assignment.maxScore}分</span>
                            </div>
                            <div className={(mySubmission.score ?? 0) >= 60 ? 'text-teal-600' : 'text-red-600'}>
                              {(mySubmission.score ?? 0) >= 60 ? '已通过' : '未通过，需要重新提交'}
                            </div>
                          </div>
                        </div>
                        {mySubmission.feedback && (
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              教师评语
                            </h4>
                            <p className="text-gray-700">{mySubmission.feedback}</p>
                          </div>
                        )}
                        <div className="mt-4 text-sm text-gray-500">
                          提交时间: {formatDate(mySubmission.submittedAt)}
                          {mySubmission.gradedAt && ` · 批改时间: ${formatDate(mySubmission.gradedAt)}`}
                        </div>
                      </div>
                    )}

                    {(mySubmission?.status === 'submitted' || mySubmission?.status === 'late') && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                          <h3 className="text-lg font-semibold text-blue-800">等待批改中...</h3>
                        </div>
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">你提交的内容:</h4>
                          <div className="bg-white rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                            {mySubmission.content}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          提交时间: {formatDate(mySubmission.submittedAt)}
                        </div>
                      </div>
                    )}

                    {(mySubmission?.status === 'not_submitted' || !mySubmission || (mySubmission.status === 'graded' && (mySubmission.score ?? 0) < 60)) && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Edit3 className="w-5 h-5 text-blue-800" />
                            {mySubmission?.status === 'graded' && (mySubmission.score ?? 0) < 60 ? '重新提交作业' : '提交作业'}
                          </h3>
                        </div>
                        <textarea
                          value={submissionContent}
                          onChange={(e) => setSubmissionContent(e.target.value)}
                          placeholder="请输入你的作业内容..."
                          className="w-full h-64 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent resize-none"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={handleSubmitAssignment}
                            disabled={submittingAssignment || !submissionContent.trim()}
                            className="flex items-center gap-2 px-8 py-3 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            {submittingAssignment ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Send className="w-5 h-5" />
                            )}
                            {submittingAssignment ? '提交中...' : '提交作业'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-8 flex items-center justify-between">
                      <div></div>
                      {!currentLessonStatus.completed && (
                        <button
                          onClick={handleMarkComplete}
                          disabled={!canMarkComplete()}
                          className={cn(
                            'flex items-center gap-2 px-6 py-2 font-semibold rounded-xl transition-colors',
                            canMarkComplete()
                              ? 'bg-teal-600 text-white hover:bg-teal-700'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          )}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          标记完成
                        </button>
                      )}
                      {currentLessonStatus.completed && (
                        <span className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 font-semibold rounded-xl">
                          <CheckCircle2 className="w-5 h-5" />
                          已完成
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <AlertCircle className="w-16 h-16 mb-4 text-gray-300" />
                  <p>作业信息加载失败</p>
                </div>
              )}
            </div>
          )}
        </main>

        {showNotePanel && (
          <aside className="w-80 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-blue-800" />
                课时笔记
              </h3>
              <button
                onClick={() => setShowNotePanel(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">笔记内容</label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="记录你的笔记..."
                    className="w-full h-24 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent resize-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">标签</label>
                  <div className="flex gap-2">
                    {(['normal', 'important', 'question'] as NoteTag[]).map((tag) => {
                      const badge = getNoteTagBadge(tag);
                      const TagIcon = badge.icon;
                      return (
                        <button
                          key={tag}
                          onClick={() => setNoteTag(tag)}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            noteTag === tag
                              ? 'bg-blue-800 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          <TagIcon className="w-4 h-4" />
                          {badge.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={handleCreateNote}
                  disabled={addingNote || !noteContent.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {addingNote ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {addingNote ? '添加中...' : '添加笔记'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {notesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-blue-800 animate-spin" />
                </div>
              ) : lessonNotes.length > 0 ? (
                <div className="space-y-4">
                  {lessonNotes.map((note) => {
                    const badge = getNoteTagBadge(note.tag);
                    const TagIcon = badge.icon;
                    return (
                      <div
                        key={note.id}
                        className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn(
                            'flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
                            badge.className
                          )}>
                            <TagIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                          {note.timePoint !== undefined && note.timePoint !== null && (
                            <span className="text-xs text-gray-400 font-mono">
                              {Math.floor(note.timePoint / 60)}:{(note.timePoint % 60).toString().padStart(2, '0')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                          {note.content}
                        </p>
                        <div className="text-xs text-gray-400">
                          {formatDate(note.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <StickyNote className="w-12 h-12 mb-2 text-gray-200" />
                  <p className="text-sm">暂无笔记</p>
                  <p className="text-xs">记录你的学习心得吧</p>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
