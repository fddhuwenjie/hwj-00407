import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Clock,
  User,
  Loader2,
  X,
  Send,
  Trophy,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import {
  getMyStudyGroups,
  getStudyGroupsByCourse,
  getAllGroupsForInstructor,
  getCourses,
  getEnrollmentWithProgress,
  createStudyGroup,
  joinStudyGroup,
} from '@/utils/api';
import { cn } from '@/lib/utils';
import type { StudyGroup, Course, GroupMember, GroupJoinStatus } from '../../shared/types.js';

type StudentTab = 'my' | 'discover';
type InstructorTab = 'ranking';

interface MyStudyGroup extends StudyGroup {
  memberStatus?: GroupJoinStatus;
}

export default function StudyGroupsPage() {
  const { currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [myGroups, setMyGroups] = useState<MyStudyGroup[]>([]);
  const [allGroups, setAllGroups] = useState<StudyGroup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([]);
  const [studentTab, setStudentTab] = useState<StudentTab>('my');
  const [instructorTab, setInstructorTab] = useState<InstructorTab>('ranking');
  const [selectedCourseId, setSelectedCourseId] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    courseId: '',
    maxMembers: '10',
  });
  const [submitting, setSubmitting] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentUser && studentTab === 'discover') {
      loadDiscoverGroups();
    }
  }, [studentTab, selectedCourseId, currentUser]);

  const loadInitialData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [coursesData, myGroupsData, enrollmentData] = await Promise.all([
        getCourses(),
        getMyStudyGroups(),
        getEnrollmentWithProgress(currentUser.id),
      ]);
      setCourses(coursesData);
      setMyGroups(myGroupsData.map(g => ({
        ...g,
        memberStatus: g.members?.find(m => m.userId === currentUser.id)?.status || 'approved',
      })));
      setEnrolledCourseIds(enrollmentData.map(e => e.enrollment.courseId));
    } finally {
      setLoading(false);
    }
  };

  const loadDiscoverGroups = async () => {
    if (!currentUser) return;
    try {
      let groups: StudyGroup[] = [];
      if (selectedCourseId === 'all') {
        const results = await Promise.all(
          enrolledCourseIds.map(courseId => getStudyGroupsByCourse(courseId))
        );
        groups = results.flat();
      } else {
        groups = await getStudyGroupsByCourse(selectedCourseId);
      }
      const myGroupIds = new Set(myGroups.map(g => g.id));
      setAllGroups(groups.filter(g => !myGroupIds.has(g.id)));
    } catch {
      setAllGroups([]);
    }
  };

  const loadInstructorRanking = async () => {
    if (!currentUser || currentUser.role !== 'instructor') return;
    setLoading(true);
    try {
      const groups = await getAllGroupsForInstructor();
      setAllGroups(groups.sort((a, b) => {
        const aScore = (a._count?.discussions || 0) + (a._count?.members || 0);
        const bScore = (b._count?.discussions || 0) + (b._count?.members || 0);
        return bScore - aScore;
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'instructor') {
      loadInstructorRanking();
    }
  }, [currentUser]);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCreateGroup = async () => {
    if (!currentUser) return;
    const { name, description, courseId, maxMembers } = createForm;
    if (!name.trim() || !description.trim() || !courseId || !maxMembers) return;

    setSubmitting(true);
    try {
      const newGroup = await createStudyGroup({
        name: name.trim(),
        description: description.trim(),
        courseId: Number(courseId),
        maxMembers: Number(maxMembers),
      });
      setMyGroups(prev => [{ ...newGroup, memberStatus: 'approved' as const }, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', courseId: '', maxMembers: '10' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    if (!currentUser) return;
    setJoiningGroupId(groupId);
    try {
      const member = await joinStudyGroup(groupId);
      const joinedGroup = allGroups.find(g => g.id === groupId);
      if (joinedGroup) {
        setAllGroups(prev => prev.filter(g => g.id !== groupId));
        setMyGroups(prev => [{
          ...joinedGroup,
          members: [...(joinedGroup.members || []), member],
          _count: {
            ...joinedGroup._count,
            members: (joinedGroup._count?.members || 0) + 1,
          },
          memberStatus: member.status,
        }, ...prev]);
      }
    } finally {
      setJoiningGroupId(null);
    }
  };

  const filteredGroups = allGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const isInstructor = currentUser?.role === 'instructor';

  const renderGroupCard = (group: StudyGroup | MyStudyGroup, showJoinButton = false, showStatus = false, rank?: number) => {
    const memberCount = group._count?.members || 0;
    const maxMembers = group.maxMembers;
    const isFull = memberCount >= maxMembers;
    const discussionCount = group._count?.discussions || 0;
    const activityScore = discussionCount + memberCount;
    const memberStatus = 'memberStatus' in group ? group.memberStatus : undefined;

    return (
      <div
        key={group.id}
        className={cn(
          'bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md',
          rank && rank <= 3 && 'ring-2 ring-amber-200'
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {rank && rank <= 3 && (
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm',
                  rank === 1 && 'bg-amber-500',
                  rank === 2 && 'bg-gray-400',
                  rank === 3 && 'bg-amber-700'
                )}>
                  <Trophy className="w-4 h-4" />
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-900 truncate">{group.name}</h3>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg">
                {group.course?.title}
              </span>
              {showStatus && memberStatus && (
                <span className={cn(
                  'px-2 py-1 text-xs font-medium rounded-lg flex items-center gap-1',
                  memberStatus === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : memberStatus === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                )}>
                  {memberStatus === 'approved' ? (
                    <><CheckCircle className="w-3 h-3" /> 已加入</>
                  ) : memberStatus === 'pending' ? (
                    <><AlertCircle className="w-3 h-3" /> 待审批</>
                  ) : (
                    '已拒绝'
                  )}
                </span>
              )}
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{group.description}</p>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{memberCount} / {maxMembers} 人</span>
              </div>
              {isInstructor && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{discussionCount} 讨论</span>
                </div>
              )}
              {isInstructor && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>活跃度 {activityScore}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-white text-xs font-medium">
                  {group.creator?.avatar ? (
                    <img src={group.creator.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <span className="text-sm text-gray-700 font-medium">{group.creator?.name}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{formatDate(group.createdAt)}</span>
              </div>
            </div>
          </div>

          {showJoinButton && (
            <button
              onClick={() => handleJoinGroup(group.id)}
              disabled={isFull || joiningGroupId === group.id}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-xl font-semibold transition-all flex-shrink-0',
                isFull
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-800 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
              )}
            >
              {joiningGroupId === group.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isFull ? '已满员' : '申请加入'}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-800 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学习小组</h1>
          <p className="text-gray-500">
            {isInstructor ? '查看所有小组的活跃度排名' : '加入小组，与同学一起学习进步'}
          </p>
        </div>

        {!isInstructor && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            创建小组
          </button>
        )}
      </div>

      {isInstructor ? (
        <>
          <div className="flex items-center gap-2 border-b border-gray-200">
            <button
              onClick={() => setInstructorTab('ranking')}
              className={cn(
                'px-6 py-3 font-medium border-b-2 transition-colors -mb-px',
                instructorTab === 'ranking'
                  ? 'border-blue-800 text-blue-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              所有小组活跃度排名
            </button>
          </div>

          <div className="space-y-4">
            {allGroups.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无小组</h3>
                <p className="text-gray-500">还没有学员创建学习小组</p>
              </div>
            ) : (
              allGroups.map((group, index) => renderGroupCard(group, false, false, index + 1))
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 border-b border-gray-200">
            <button
              onClick={() => setStudentTab('my')}
              className={cn(
                'px-6 py-3 font-medium border-b-2 transition-colors -mb-px',
                studentTab === 'my'
                  ? 'border-blue-800 text-blue-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Users className="w-4 h-4 inline mr-2" />
              我的小组
            </button>
            <button
              onClick={() => setStudentTab('discover')}
              className={cn(
                'px-6 py-3 font-medium border-b-2 transition-colors -mb-px',
                studentTab === 'discover'
                  ? 'border-blue-800 text-blue-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Search className="w-4 h-4 inline mr-2" />
              发现小组
            </button>
          </div>

          {studentTab === 'my' ? (
            <div className="space-y-4">
              {myGroups.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">还没有加入任何小组</h3>
                  <p className="text-gray-500 mb-4">去发现小组看看，或者创建自己的学习小组吧！</p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setStudentTab('discover')}
                      className="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      发现小组
                    </button>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-2 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      创建小组
                    </button>
                  </div>
                </div>
              ) : (
                myGroups.map(group => renderGroupCard(group, false, true))
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索小组名称或描述..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
                  >
                    <option value="all">全部课程</option>
                    {courses
                      .filter(c => enrolledCourseIds.includes(c.id))
                      .map(course => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {filteredGroups.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">没有找到相关小组</h3>
                    <p className="text-gray-500 mb-4">换个关键词试试，或者创建一个新小组吧！</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-2 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      创建小组
                    </button>
                  </div>
                ) : (
                  filteredGroups.map(group => renderGroupCard(group, true, false))
                )}
              </div>
            </>
          )}
        </>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">创建学习小组</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  小组名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入小组名称"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  小组描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="介绍一下你的小组，吸引志同道合的同学加入..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all resize-none"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  关联课程 <span className="text-red-500">*</span>
                </label>
                <select
                  value={createForm.courseId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, courseId: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
                >
                  <option value="">请选择关联课程</option>
                  {courses
                    .filter(c => enrolledCourseIds.includes(c.id))
                    .map(course => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大人数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={createForm.maxMembers}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, maxMembers: e.target.value }))}
                  placeholder="请输入最大人数"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={
                  submitting ||
                  !createForm.name.trim() ||
                  !createForm.description.trim() ||
                  !createForm.courseId ||
                  !createForm.maxMembers
                }
                className="flex items-center gap-2 px-6 py-2 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    创建
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
