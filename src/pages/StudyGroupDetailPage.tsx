import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  MessageCircle,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Send,
  X,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Target,
  UserX,
  Check,
  Crown,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  getStudyGroupById,
  getGroupProgress,
  getGroupDiscussions,
  createGroupDiscussion,
  createGroupDiscussionReply,
  approveGroupMember,
  rejectGroupMember,
  removeGroupMember,
  setGroupWeeklyGoal,
} from '@/utils/api';
import { cn } from '@/lib/utils';
import type {
  StudyGroup,
  GroupMemberProgress,
  GroupDiscussion,
  GroupDiscussionReply,
  GroupMember,
} from '../../shared/types.js';

type TabType = 'progress' | 'discussions' | 'members';

export default function StudyGroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [progress, setProgress] = useState<GroupMemberProgress[]>([]);
  const [discussions, setDiscussions] = useState<GroupDiscussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('progress');

  const [expandedDiscussionId, setExpandedDiscussionId] = useState<number | null>(null);
  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionContent, setNewDiscussionContent] = useState('');
  const [replyContents, setReplyContents] = useState<Record<number, string>>({});
  const [submittingDiscussion, setSubmittingDiscussion] = useState(false);
  const [submittingReply, setSubmittingReply] = useState<number | null>(null);

  const [weeklyGoal, setWeeklyGoal] = useState('');
  const [submittingGoal, setSubmittingGoal] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const [groupData, progressData, discussionsData] = await Promise.all([
        getStudyGroupById(Number(groupId)),
        getGroupProgress(Number(groupId)),
        getGroupDiscussions(Number(groupId)),
      ]);
      setGroup(groupData);
      setProgress(progressData);
      setDiscussions(discussionsData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return d.toLocaleDateString('zh-CN');
  };

  const currentMember = group?.members?.find(
    (m) => m.userId === currentUser?.id && m.status === 'approved'
  );
  const isAdmin = currentMember?.role === 'admin';
  const pendingMembers = group?.members?.filter((m) => m.status === 'pending') || [];
  const approvedMembers = group?.members?.filter((m) => m.status === 'approved') || [];

  const handleCreateDiscussion = async () => {
    if (!groupId || !currentUser || !newDiscussionTitle.trim() || !newDiscussionContent.trim()) return;
    setSubmittingDiscussion(true);
    try {
      const newDiscussion = await createGroupDiscussion(
        Number(groupId),
        newDiscussionTitle.trim(),
        newDiscussionContent.trim()
      );
      setDiscussions((prev) => [newDiscussion, ...prev]);
      setShowNewDiscussionModal(false);
      setNewDiscussionTitle('');
      setNewDiscussionContent('');
    } finally {
      setSubmittingDiscussion(false);
    }
  };

  const handleCreateReply = async (discussionId: number) => {
    if (!currentUser) return;
    const content = replyContents[discussionId];
    if (!content?.trim()) return;

    setSubmittingReply(discussionId);
    try {
      const newReply = await createGroupDiscussionReply(discussionId, content.trim());
      setDiscussions((prev) =>
        prev.map((discussion) =>
          discussion.id === discussionId
            ? {
                ...discussion,
                replies: [...(discussion.replies || []), newReply],
                _count: { replies: (discussion._count?.replies || 0) + 1 },
              }
            : discussion
        )
      );
      setReplyContents((prev) => ({ ...prev, [discussionId]: '' }));
    } finally {
      setSubmittingReply(null);
    }
  };

  const handleApproveMember = async (userId: number) => {
    if (!groupId) return;
    setActionLoading((prev) => ({ ...prev, [`approve-${userId}`]: true }));
    try {
      await approveGroupMember(Number(groupId), userId);
      setGroup((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members?.map((m) =>
                m.userId === userId ? { ...m, status: 'approved' as const } : m
              ),
            }
          : null
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`approve-${userId}`]: false }));
    }
  };

  const handleRejectMember = async (userId: number) => {
    if (!groupId) return;
    setActionLoading((prev) => ({ ...prev, [`reject-${userId}`]: true }));
    try {
      await rejectGroupMember(Number(groupId), userId);
      setGroup((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members?.map((m) =>
                m.userId === userId ? { ...m, status: 'rejected' as const } : m
              ),
            }
          : null
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [`reject-${userId}`]: false }));
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!groupId) return;
    setActionLoading((prev) => ({ ...prev, [`remove-${userId}`]: true }));
    try {
      await removeGroupMember(Number(groupId), userId);
      setGroup((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members?.filter((m) => m.userId !== userId),
              _count: { ...prev._count, members: (prev._count?.members || 0) - 1 },
            }
          : null
      );
      setProgress((prev) => prev.filter((p) => p.userId !== userId));
    } finally {
      setActionLoading((prev) => ({ ...prev, [`remove-${userId}`]: false }));
    }
  };

  const handleSetWeeklyGoal = async () => {
    if (!groupId || !weeklyGoal.trim()) return;
    const goal = Number(weeklyGoal);
    if (isNaN(goal) || goal < 1) return;
    setSubmittingGoal(true);
    try {
      await setGroupWeeklyGoal(Number(groupId), goal);
      const updatedGroup = await getStudyGroupById(Number(groupId));
      setGroup(updatedGroup);
      setWeeklyGoal('');
    } finally {
      setSubmittingGoal(false);
    }
  };

  const currentGoal = group?.goals?.[0];
  const unmetGoalMembers = progress.filter((p) => !p.weeklyGoalMet);
  const lessonTitles = progress[0]?.lessons?.map((l) => l.lessonTitle) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-800 animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Users className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900">学习小组不存在</h2>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-800 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          返回首页
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'progress' as const, label: '学习进度', icon: Target },
    { id: 'discussions' as const, label: '讨论板', icon: MessageCircle },
    { id: 'members' as const, label: '成员管理', icon: Settings, adminOnly: true },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{group.name}</h1>
            <p className="text-gray-600 mb-4">{group.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>课程：{group.course?.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>
                  成员：{group._count?.members || 0} / {group.maxMembers}
                </span>
              </div>
              {currentGoal && (
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-teal-600" />
                  <span className="text-teal-700 font-medium">
                    本周目标：完成 {currentGoal.lessonsToComplete} 课时
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => {
            if (tab.adminOnly && !isAdmin) return null;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-colors',
                  activeTab === tab.id
                    ? 'text-blue-800 border-b-2 border-blue-800 bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'progress' && (
            <div className="space-y-6">
              {currentGoal && unmetGoalMembers.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-800 mb-2">未达标成员提醒</h4>
                      <p className="text-red-700">
                        本周目标：完成 {currentGoal.lessonsToComplete} 课时。以下成员尚未达标：
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {unmetGoalMembers.map((member) => (
                          <span
                            key={member.userId}
                            className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full"
                          >
                            {member.userName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {progress.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无学习进度</h3>
                  <p className="text-gray-500">小组成员还没有开始学习</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200 sticky left-0 bg-gray-50 z-10">
                          成员名称
                        </th>
                        {lessonTitles.map((title, index) => (
                          <th
                            key={index}
                            className="px-4 py-3 text-center text-sm font-semibold text-gray-900 border-b border-gray-200 whitespace-nowrap"
                          >
                            {title}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 border-b border-gray-200">
                          完成进度
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {progress.map((member) => {
                        const completionRate =
                          member.totalLessons > 0
                            ? Math.round((member.completedLessons / member.totalLessons) * 100)
                            : 0;
                        return (
                          <tr
                            key={member.userId}
                            className={cn(
                              'hover:bg-gray-50 transition-colors',
                              !member.weeklyGoalMet && currentGoal && 'bg-red-50/50'
                            )}
                          >
                            <td className="px-4 py-3 border-b border-gray-100 sticky left-0 bg-inherit">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-white text-sm font-medium">
                                  {member.userName.charAt(0)}
                                </div>
                                <span
                                  className={cn(
                                    'font-medium',
                                    !member.weeklyGoalMet && currentGoal && 'text-red-700'
                                  )}
                                >
                                  {member.userName}
                                </span>
                                {!member.weeklyGoalMet && currentGoal && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                    未达标
                                  </span>
                                )}
                              </div>
                            </td>
                            {member.lessons?.map((lesson, index) => (
                              <td
                                key={index}
                                className="px-4 py-3 text-center border-b border-gray-100"
                              >
                                {lesson.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-teal-600 mx-auto" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                                )}
                              </td>
                            ))}
                            <td className="px-4 py-3 text-center border-b border-gray-100">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-teal-600 rounded-full transition-all"
                                    style={{ width: `${completionRate}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                  {member.completedLessons}/{member.totalLessons}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'discussions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">小组讨论</h3>
                <button
                  onClick={() => setShowNewDiscussionModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  发起讨论
                </button>
              </div>

              {discussions.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">还没有讨论</h3>
                  <p className="text-gray-500 mb-4">成为第一个发起讨论的人吧！</p>
                  <button
                    onClick={() => setShowNewDiscussionModal(true)}
                    className="px-6 py-2 bg-blue-800 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    发起第一个讨论
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {discussions.map((discussion) => {
                    const isExpanded = expandedDiscussionId === discussion.id;
                    const replyCount = discussion._count?.replies || 0;

                    return (
                      <div
                        key={discussion.id}
                        className={cn(
                          'bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300',
                          isExpanded && 'ring-2 ring-blue-800/20'
                        )}
                      >
                        <div
                          onClick={() =>
                            setExpandedDiscussionId(isExpanded ? null : discussion.id)
                          }
                          className="p-6 cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {discussion.title}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-800 flex items-center justify-center text-white text-xs font-medium">
                                    {discussion.user?.name.charAt(0)}
                                  </div>
                                  <span>{discussion.user?.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatDate(discussion.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-4 h-4" />
                                  <span>{replyCount} 回复</span>
                                </div>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-6 pb-6 border-t border-gray-100">
                            <div className="pt-4 mb-6">
                              <div className="prose prose-sm max-w-none">
                                <MarkdownRenderer content={discussion.content} />
                              </div>
                            </div>

                            {(discussion.replies?.length || 0) > 0 && (
                              <div className="space-y-4 mb-6">
                                <h4 className="font-semibold text-gray-900">
                                  回复 ({replyCount})
                                </h4>
                                {discussion.replies?.map(
                                  (reply: GroupDiscussionReply) => (
                                    <div
                                      key={reply.id}
                                      className="flex gap-4 p-4 bg-gray-50 rounded-xl"
                                    >
                                      <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                        {reply.user?.name.charAt(0)}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium text-gray-900">
                                            {reply.user?.name}
                                          </span>
                                          <span className="text-sm text-gray-400">
                                            {formatDate(reply.createdAt)}
                                          </span>
                                        </div>
                                        <div className="text-gray-600">
                                          <MarkdownRenderer content={reply.content} />
                                        </div>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            )}

                            <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                {currentUser?.name.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <textarea
                                  value={replyContents[discussion.id] || ''}
                                  onChange={(e) =>
                                    setReplyContents((prev) => ({
                                      ...prev,
                                      [discussion.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="写下你的回复..."
                                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all resize-none"
                                  rows={3}
                                />
                                <div className="flex justify-end mt-2">
                                  <button
                                    onClick={() => handleCreateReply(discussion.id)}
                                    disabled={
                                      submittingReply === discussion.id ||
                                      !replyContents[discussion.id]?.trim()
                                    }
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {submittingReply === discussion.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Send className="w-4 h-4" />
                                        回复
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && isAdmin && (
            <div className="space-y-8">
              {pendingMembers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    待审批成员 ({pendingMembers.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center text-white text-sm font-medium">
                            {member.user?.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {member.user?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              申请加入：{formatDate(member.joinedAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRejectMember(member.userId)}
                            disabled={
                              actionLoading[`reject-${member.userId}`] ||
                              actionLoading[`approve-${member.userId}`]
                            }
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {actionLoading[`reject-${member.userId}`] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            拒绝
                          </button>
                          <button
                            onClick={() => handleApproveMember(member.userId)}
                            disabled={
                              actionLoading[`approve-${member.userId}`] ||
                              actionLoading[`reject-${member.userId}`]
                            }
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {actionLoading[`approve-${member.userId}`] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            批准
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-800" />
                  已加入成员 ({approvedMembers.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                          成员
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                          角色
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                          加入时间
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                          状态
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border-b border-gray-200">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedMembers.map((member) => (
                        <tr
                          key={member.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-white text-sm font-medium">
                                {member.user?.name.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-900">
                                {member.user?.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-100">
                            {member.role === 'admin' ? (
                              <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded">
                                <Crown className="w-3 h-3" />
                                管理员
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                                成员
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-100 text-gray-600">
                            {new Date(member.joinedAt).toLocaleDateString('zh-CN')}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-100">
                            <span className="px-2 py-1 bg-teal-100 text-teal-700 text-sm font-medium rounded">
                              已加入
                            </span>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-100 text-right">
                            {member.role !== 'admin' && (
                              <button
                                onClick={() => handleRemoveMember(member.userId)}
                                disabled={actionLoading[`remove-${member.userId}`]}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-auto"
                              >
                                {actionLoading[`remove-${member.userId}`] ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <UserX className="w-4 h-4" />
                                )}
                                移除
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-teal-600" />
                  设置每周学习目标
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  {currentGoal && (
                    <div className="mb-4 p-4 bg-teal-50 border border-teal-200 rounded-xl">
                      <p className="text-teal-700">
                        当前周目标：每周完成{' '}
                        <span className="font-bold text-teal-800">
                          {currentGoal.lessonsToComplete}
                        </span>{' '}
                        课时
                      </p>
                      <p className="text-sm text-teal-600 mt-1">
                        设置时间：{new Date(currentGoal.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        每周需要完成的课时数
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={weeklyGoal}
                        onChange={(e) => setWeeklyGoal(e.target.value)}
                        placeholder="请输入课时数"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
                      />
                    </div>
                    <button
                      onClick={handleSetWeeklyGoal}
                      disabled={
                        submittingGoal ||
                        !weeklyGoal.trim() ||
                        isNaN(Number(weeklyGoal)) ||
                        Number(weeklyGoal) < 1
                      }
                      className="flex items-center gap-2 px-6 py-3 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {submittingGoal ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      设置目标
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewDiscussionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowNewDiscussionModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">发起新讨论</h2>
              <button
                onClick={() => setShowNewDiscussionModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  讨论标题
                </label>
                <input
                  type="text"
                  value={newDiscussionTitle}
                  onChange={(e) => setNewDiscussionTitle(e.target.value)}
                  placeholder="请输入讨论标题"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  讨论内容 (支持 Markdown)
                </label>
                <textarea
                  value={newDiscussionContent}
                  onChange={(e) => setNewDiscussionContent(e.target.value)}
                  placeholder="请输入讨论内容..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all resize-none"
                  rows={8}
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowNewDiscussionModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateDiscussion}
                disabled={
                  submittingDiscussion ||
                  !newDiscussionTitle.trim() ||
                  !newDiscussionContent.trim()
                }
                className="flex items-center gap-2 px-6 py-2 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {submittingDiscussion ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    发布
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
