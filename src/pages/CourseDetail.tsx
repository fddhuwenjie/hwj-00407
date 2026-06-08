import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PlayCircle,
  FileText,
  HelpCircle,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  MessageCircle,
  Loader2,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { useCourseStore } from '@/store/useCourseStore';
import { useAuthStore } from '@/store/useAuthStore';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { cn } from '@/lib/utils';
import type { LessonType } from '../../shared/types.js';

const difficultyMap: Record<string, { label: string; className: string }> = {
  beginner: { label: '入门', className: 'bg-teal-100 text-teal-700' },
  intermediate: { label: '进阶', className: 'bg-amber-100 text-amber-700' },
  advanced: { label: '高级', className: 'bg-red-100 text-red-700' },
};

const lessonTypeIcons: Record<LessonType, React.ElementType> = {
  video: PlayCircle,
  document: FileText,
  quiz: HelpCircle,
};

const lessonTypeLabels: Record<LessonType, string> = {
  video: '视频',
  document: '文档',
  quiz: '测验',
};

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { currentCourse, loading, currentProgress, fetchCourseById, enrollCourse, fetchProgress, clearCurrentCourse } = useCourseStore();
  const { currentUser } = useAuthStore();
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseById(Number(courseId));
      fetchProgress(Number(courseId));
    }
    return () => clearCurrentCourse();
  }, [courseId, fetchCourseById, fetchProgress, clearCurrentCourse]);

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const handleEnroll = async () => {
    if (!courseId || !currentUser) return;
    setEnrolling(true);
    try {
      await enrollCourse(Number(courseId));
      await fetchProgress(Number(courseId));
    } finally {
      setEnrolling(false);
    }
  };

  const handleContinueLearning = () => {
    if (!courseId || !currentProgress) return;
    const firstUncompleted = currentProgress.lessons.find((l) => !l.completed && l.unlocked);
    const lessonId = firstUncompleted?.lessonId || currentProgress.lessons[0]?.lessonId;
    if (lessonId) {
      navigate(`/courses/${courseId}/learn/${lessonId}`);
    }
  };

  const handleLessonClick = (lessonId: number, unlocked: boolean) => {
    if (!courseId || !unlocked) return;
    navigate(`/courses/${courseId}/learn/${lessonId}`);
  };

  const getLessonStatus = (lessonId: number) => {
    if (!currentProgress) return { completed: false, unlocked: true };
    const lessonProgress = currentProgress.lessons.find((l) => l.lessonId === lessonId);
    return {
      completed: lessonProgress?.completed || false,
      unlocked: lessonProgress?.unlocked || true,
    };
  };

  const isEnrolled = currentProgress !== null;
  const totalLessons = currentProgress?.totalLessons || 0;
  const completedLessons = currentProgress?.completedLessons || 0;
  const progressPercentage = currentProgress?.progressPercentage || 0;

  if (loading && !currentCourse) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-800 animate-spin" />
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <BookOpen className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900">课程不存在</h2>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-800 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          返回首页
        </button>
      </div>
    );
  }

  const difficulty = difficultyMap[currentCourse.difficulty] || difficultyMap.beginner;
  const sortedChapters = [...(currentCourse.chapters || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-8">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-800 to-teal-700">
        <div className="absolute inset-0 opacity-20">
          <img
            src={currentCourse.coverImageUrl}
            alt={currentCourse.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full">
                  {currentCourse.category}
                </span>
                <span className={cn('px-4 py-1.5 text-sm font-medium rounded-full', difficulty.className)}>
                  {difficulty.label}
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white">
                {currentCourse.title}
              </h1>
              <p className="text-lg text-white/80 max-w-2xl">
                {currentCourse.description}
              </p>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center gap-3">
                  {currentCourse.instructor ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-800 font-bold text-lg">
                        {currentCourse.instructor.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{currentCourse.instructor.name}</div>
                        <div className="text-white/70 text-sm">讲师</div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-white/70">
                      <User className="w-5 h-5" />
                      <span>讲师未设置</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-xl min-w-[280px]">
              {isEnrolled ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {Math.round(progressPercentage)}%
                    </div>
                    <div className="text-sm text-gray-500">
                      已完成 {completedLessons}/{totalLessons} 课时
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <button
                    onClick={handleContinueLearning}
                    className="w-full py-3 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    继续学习
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      免费学习
                    </div>
                    <div className="text-sm text-gray-500">
                      加入课程，开启学习之旅
                    </div>
                  </div>
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling || !currentUser}
                    className="w-full py-3 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {enrolling ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      '加入课程'
                    )}
                  </button>
                  {!currentUser && (
                    <p className="text-xs text-center text-gray-500">
                      请先在右上角选择账号登录
                    </p>
                  )}
                </div>
              )}
              <button
                onClick={() => navigate(`/courses/${courseId}/discussions`)}
                className="w-full py-3 mt-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                讨论区
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">课程介绍</h2>
            <MarkdownRenderer content={currentCourse.description} />
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">课程章节</h2>
            <div className="space-y-4">
              {sortedChapters.map((chapter, chapterIndex) => {
                const isExpanded = expandedChapters.has(chapter.id);
                const sortedLessons = [...(chapter.lessons || [])].sort((a, b) => a.order - b.order);
                const chapterCompletedCount = sortedLessons.filter(
                  (l) => getLessonStatus(l.id).completed
                ).length;

                return (
                  <div key={chapter.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => toggleChapter(chapter.id)}
                      className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center text-white font-bold">
                          {chapterIndex + 1}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900">{chapter.title}</h3>
                          <p className="text-sm text-gray-500">
                            {sortedLessons.length} 课时 · 已完成 {chapterCompletedCount}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    <div
                      className={cn(
                        'transition-all duration-300 overflow-hidden',
                        isExpanded ? 'max-h-[1000px]' : 'max-h-0'
                      )}
                    >
                      <div className="p-2">
                        {sortedLessons.map((lesson, lessonIndex) => {
                          const Icon = lessonTypeIcons[lesson.type];
                          const status = getLessonStatus(lesson.id);

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => handleLessonClick(lesson.id, status.unlocked)}
                              disabled={!status.unlocked}
                              className={cn(
                                'w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left mb-1 last:mb-0',
                                status.unlocked
                                  ? 'hover:bg-blue-50 cursor-pointer'
                                  : 'opacity-60 cursor-not-allowed'
                              )}
                            >
                              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                                {status.completed ? (
                                  <CheckCircle2 className="w-6 h-6 text-teal-600" />
                                ) : !status.unlocked ? (
                                  <Lock className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <Icon className="w-6 h-6 text-blue-800" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                    {lessonTypeLabels[lesson.type]}
                                  </span>
                                  <span
                                    className={cn(
                                      'font-medium truncate',
                                      status.completed ? 'text-gray-500' : 'text-gray-900'
                                    )}
                                  >
                                    {lesson.title}
                                  </span>
                                </div>
                              </div>
                              {lesson.duration && (
                                <div className="flex items-center gap-1 text-gray-500 text-sm flex-shrink-0">
                                  <Clock className="w-4 h-4" />
                                  <span>{lesson.duration}分钟</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
