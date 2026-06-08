import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  BookOpen,
  Award,
  User,
  Loader2,
  Mail,
  Calendar,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import ProgressRing from '@/components/ProgressRing';
import { getUserCertificates, getCourseProgress } from '@/utils/api';
import { cn } from '@/lib/utils';
import type { Certificate, Enrollment, CourseProgress } from '../../shared/types.js';

interface EnrollmentWithProgress {
  enrollment: Enrollment;
  progress: CourseProgress;
}

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [certs, myCourses] = await Promise.all([
        getUserCertificates(currentUser.id),
        loadEnrollmentsWithProgress(currentUser.id),
      ]);
      setCertificates(certs);
      setEnrollments(myCourses);
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollmentsWithProgress = async (userId: number): Promise<EnrollmentWithProgress[]> => {
    try {
      const response = await fetch(`/api/users/${userId}/enrollments`, {
        headers: { 'x-user-id': String(userId) },
      });
      const result = await response.json();
      if (result.success && result.data) {
        const enrollments: Enrollment[] = result.data;
        const withProgress = await Promise.all(
          enrollments.map(async (enrollment) => {
            try {
              const progress = await getCourseProgress(enrollment.courseId);
              return { enrollment, progress };
            } catch {
              return {
                enrollment,
                progress: {
                  courseId: enrollment.courseId,
                  totalLessons: 0,
                  completedLessons: 0,
                  progressPercentage: 0,
                  totalTimeSpent: 0,
                  lessons: [],
                },
              };
            }
          })
        );
        return withProgress;
      }
      return [];
    } catch {
      return [];
    }
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) {
      return `${h}小时${m > 0 ? `${m}分钟` : ''}`;
    }
    return `${m}分钟`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const totalStudyTime = enrollments.reduce(
    (sum, item) => sum + item.progress.totalTimeSpent,
    0
  );
  const completedCourses = enrollments.filter(
    (item) => item.progress.progressPercentage === 100
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-800 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <User className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900">请先登录</h2>
        <p className="text-gray-500">请在右上角选择账号登录后查看个人中心</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-800 to-teal-700 rounded-3xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-blue-800 text-4xl font-bold shadow-lg">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{currentUser.name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/80">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {currentUser.email}
              </span>
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {currentUser.role === 'instructor' ? '讲师' : '学员'}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                加入于 {formatDate(currentUser.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {formatDuration(Math.floor(totalStudyTime / 60))}
              </div>
              <div className="text-sm text-gray-500">总学习时长</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-teal-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {completedCourses} / {enrollments.length}
              </div>
              <div className="text-sm text-gray-500">已完成课程</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Award className="w-7 h-7 text-blue-800" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {certificates.length}
              </div>
              <div className="text-sm text-gray-500">获得证书</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">我的课程</h2>
          <button
            onClick={() => navigate('/')}
            className="text-blue-800 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            浏览更多课程
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有学习任何课程</h3>
            <p className="text-gray-500 mb-4">去首页探索感兴趣的课程吧</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-800 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              浏览课程
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map(({ enrollment, progress }) => {
              const course = enrollment.course;
              if (!course) return null;

              const isCompleted = progress.progressPercentage === 100;
              const studyTime = Math.floor(progress.totalTimeSpent / 60);

              return (
                <div
                  key={enrollment.id}
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="group bg-gray-50 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={course.coverImageUrl}
                      alt={course.title}
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-800 transition-colors">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(studyTime)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <ProgressRing progress={progress.progressPercentage} size={60} strokeWidth={6} />
                    <div className="text-right">
                      <div
                        className={cn(
                          'px-3 py-1 rounded-full text-sm font-medium',
                          isCompleted
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {isCompleted ? '已完成' : '学习中'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {progress.completedLessons}/{progress.totalLessons} 课时
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">我的证书</h2>

        {certificates.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有获得证书</h3>
            <p className="text-gray-500">完成课程学习并通过考核后即可获得证书</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => {
              const course = cert.course;
              if (!course) return null;

              return (
                <div
                  key={cert.id}
                  className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(cert.issuedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/80 rounded-xl p-3 mb-4">
                    <div className="text-xs text-gray-500 mb-1">证书编号</div>
                    <div className="font-mono text-sm text-gray-700 break-all">
                      {cert.certificateNumber}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/certificates/${cert.certificateNumber}`);
                    }}
                    className="w-full py-2 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    查看证书
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
