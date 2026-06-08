import { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  Target,
  Award,
  MessageCircle,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Clock,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { useAuthStore } from '@/store/useAuthStore';
import { useCourseStore } from '@/store/useCourseStore';
import {
  getDashboardStats,
  getDailyEnrollments,
  getLessonCompletion,
  getStudyTimeDistribution,
} from '@/utils/api';
import { cn } from '@/lib/utils';
import type {
  DashboardStats,
  DailyEnrollment,
  LessonCompletion,
  StudyTimeDistribution,
  Course,
} from '../../shared/types.js';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', bgColor)}>
          <Icon className={cn('w-7 h-7', color)} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser } = useAuthStore();
  const { courses, fetchCourses } = useCourseStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyEnrollments, setDailyEnrollments] = useState<DailyEnrollment[]>([]);
  const [lessonCompletion, setLessonCompletion] = useState<LessonCompletion[]>([]);
  const [studyTimeDistribution, setStudyTimeDistribution] = useState<StudyTimeDistribution[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses]);

  useEffect(() => {
    if (selectedCourseId) {
      loadChartData(selectedCourseId);
    }
  }, [selectedCourseId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [statsData] = await Promise.all([
        getDashboardStats(),
        fetchCourses(),
      ]);
      setStats(statsData);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async (courseId: number) => {
    setLoadingCharts(true);
    try {
      const [enrollments, completion, distribution] = await Promise.all([
        getDailyEnrollments(courseId, 30),
        getLessonCompletion(courseId),
        getStudyTimeDistribution(courseId),
      ]);
      setDailyEnrollments(enrollments);
      setLessonCompletion([...completion].sort((a, b) => a.completionRate - b.completionRate));
      setStudyTimeDistribution(distribution);
    } finally {
      setLoadingCharts(false);
    }
  };

  const instructorCourses = courses.filter(
    (c) => c.instructorId === currentUser?.id
  );

  const unrepliedPosts = 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-800 animate-spin" />
      </div>
    );
  }

  if (currentUser?.role !== 'instructor') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <BarChart3 className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900">无访问权限</h2>
        <p className="text-gray-500">该页面仅对讲师开放</p>
      </div>
    );
  }

  const chartColors = ['#1e40af', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">讲师数据面板</h1>
          <p className="text-gray-500">查看课程数据和学员学习情况</p>
        </div>

        {unrepliedPosts > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-700 font-medium">
              {unrepliedPosts} 条讨论帖待回复
            </span>
          </div>
        )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="总学员数"
          value={stats?.totalStudents || 0}
          icon={Users}
          color="text-blue-800"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="总课程数"
          value={stats?.totalCourses || 0}
          icon={BookOpen}
          color="text-teal-600"
          bgColor="bg-teal-100"
        />
        <StatCard
          title="平均完成率"
          value={`${Math.round(stats?.averageCompletionRate || 0)}%`}
          icon={Target}
          color="text-amber-600"
          bgColor="bg-amber-100"
        />
        <StatCard
          title="平均测验分数"
          value={`${Math.round(stats?.averageQuizScore || 0)}分`}
          icon={Award}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatCard
          title="讨论热度"
          value={stats?.discussionHeat || 0}
          icon={MessageCircle}
          color="text-pink-600"
          bgColor="bg-pink-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-blue-800" />
            <h2 className="text-lg font-bold text-gray-900">每日新增学员</h2>
            <span className="text-sm text-gray-500 ml-auto">最近30天</span>
          </div>
          {loadingCharts ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-800 animate-spin" />
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyEnrollments}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={(value) => {
                      const d = new Date(value);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number) => [`${value} 人`, '新增学员']}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#1e40af"
                    strokeWidth={3}
                    dot={{ fill: '#1e40af', r: 4 }}
                    activeDot={{ r: 6, fill: '#1e40af' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-gray-900">学员学习时长分布</h2>
          </div>
          {loadingCharts ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-800 animate-spin" />
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studyTimeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="range" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number) => [`${value} 人`, '学员数']}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {studyTimeDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <Target className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-gray-900">各课时完成率排行榜</h2>
          <span className="text-sm text-amber-600 ml-auto flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            按完成率升序，发现学习难点
          </span>
        </div>

        {loadingCharts ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-800 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">
                    排名
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500">
                    课时名称
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-500">
                    完成率
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-500">
                    已完成/总学员
                  </th>
                </tr>
              </thead>
              <tbody>
                {lessonCompletion.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-12 text-gray-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  lessonCompletion.map((lesson, index) => {
                    const isLow = lesson.completionRate < 50;
                    const isMedium =
                      lesson.completionRate >= 50 && lesson.completionRate < 70;

                    return (
                      <tr
                        key={lesson.lessonId}
                        className={cn(
                          'border-b border-gray-100 transition-colors',
                          isLow && 'bg-red-50/50',
                          isMedium && 'bg-amber-50/50',
                          'hover:bg-gray-50'
                        )}>
                        <td className="py-4 px-4">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                              index === 0 && 'bg-red-100 text-red-700',
                              index === 1 && 'bg-amber-100 text-amber-700',
                              index === 2 && 'bg-blue-100 text-blue-700',
                              index > 2 && 'bg-gray-100 text-gray-600'
                            )}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {isLow && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                            <span
                              className={cn(
                                'font-medium',
                                isLow
                                  ? 'text-red-700'
                                  : isMedium
                                    ? 'text-amber-700'
                                    : 'text-gray-900'
                              )}>
                              {lesson.lessonTitle}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-500',
                                  isLow
                                    ? 'bg-red-500'
                                    : isMedium
                                      ? 'bg-amber-500'
                                      : 'bg-teal-500'
                                )}
                                style={{ width: `${lesson.completionRate}%` }}
                              />
                            </div>
                            <span
                              className={cn(
                                'font-semibold text-sm w-12',
                                isLow
                                  ? 'text-red-600'
                                  : isMedium
                                    ? 'text-amber-600'
                                    : 'text-teal-600'
                              )}>
                              {Math.round(lesson.completionRate)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center text-gray-600">
                          <span className="font-medium">
                            {lesson.completedStudents}
                          </span>
                          <span className="text-gray-400"> / </span>
                          <span>{lesson.totalStudents}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
