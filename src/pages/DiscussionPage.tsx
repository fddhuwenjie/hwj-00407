import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Plus,
  Pin,
  Star,
  Clock,
  Send,
  X,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  getDiscussionPosts,
  createDiscussionPost,
  createDiscussionReply,
  togglePostFeatured,
  togglePostPinned,
} from '@/utils/api';
import { cn } from '@/lib/utils';
import type { DiscussionPost, DiscussionReply } from '../../shared/types.js';

export default function DiscussionPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [replyContents, setReplyContents] = useState<Record<number, string>>({});
  const [submittingPost, setSubmittingPost] = useState(false);
  const [submittingReply, setSubmittingReply] = useState<number | null>(null);

  useEffect(() => {
    loadPosts();
  }, [courseId]);

  const loadPosts = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const data = await getDiscussionPosts(Number(courseId));
      setPosts(data.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }));
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

  const handleCreatePost = async () => {
    if (!courseId || !currentUser || !newPostTitle.trim() || !newPostContent.trim()) return;
    setSubmittingPost(true);
    try {
      const newPost = await createDiscussionPost(
        Number(courseId),
        newPostTitle.trim(),
        newPostContent.trim()
      );
      setPosts(prev => [newPost, ...prev]);
      setShowNewPostModal(false);
      setNewPostTitle('');
      setNewPostContent('');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleCreateReply = async (postId: number) => {
    if (!currentUser) return;
    const content = replyContents[postId];
    if (!content?.trim()) return;

    setSubmittingReply(postId);
    try {
      const newReply = await createDiscussionReply(postId, content.trim());
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                replies: [...(post.replies || []), newReply],
                _count: { replies: (post._count?.replies || 0) + 1 },
              }
            : post
        )
      );
      setReplyContents(prev => ({ ...prev, [postId]: '' }));
    } finally {
      setSubmittingReply(null);
    }
  };

  const handleToggleFeatured = async (postId: number) => {
    if (!currentUser || currentUser.role !== 'instructor') return;
    try {
      const updated = await togglePostFeatured(postId);
      setPosts(prev =>
        prev.map(post => (post.id === postId ? updated : post))
      );
    } catch {}
  };

  const handleTogglePinned = async (postId: number) => {
    if (!currentUser || currentUser.role !== 'instructor') return;
    try {
      const updated = await togglePostPinned(postId);
      setPosts(prev =>
        prev.map(post => (post.id === postId ? updated : post))
      );
    } catch {}
  };

  const unrepliedCount = posts.filter(
    (post) => (post._count?.replies || 0) === 0
  ).length;

  const isInstructor = currentUser?.role === 'instructor';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-800 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回课程</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">课程讨论区</h1>
            <p className="text-gray-500">与同学和老师交流学习心得</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {unrepliedCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 font-medium">
                {unrepliedCount} 条待回复
              </span>
            </div>
          )}

          <button
            onClick={() => setShowNewPostModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            发帖
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              还没有讨论帖
            </h3>
            <p className="text-gray-500 mb-4">成为第一个发帖的人吧！</p>
            <button
              onClick={() => setShowNewPostModal(true)}
              className="px-6 py-2 bg-blue-800 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              发布第一个帖子
            </button>
          </div>
        ) : (
          posts.map((post) => {
            const isExpanded = expandedPostId === post.id;
            const hasNoReplies = (post._count?.replies || 0) === 0;
            const replyCount = post._count?.replies || 0;

            return (
              <div
                key={post.id}
                className={cn(
                  'bg-white rounded-2xl shadow-sm border transition-all duration-300',
                  hasNoReplies && !post.isPinned && !post.isFeatured
                    ? 'border-red-300 border-2'
                    : 'border-gray-100',
                  isExpanded && 'ring-2 ring-blue-800/20'
                )}
              >
                <div
                  onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                  className="p-6 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {post.isPinned && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                            <Pin className="w-3 h-3" />
                            置顶
                          </span>
                        )}
                        {post.isFeatured && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded">
                            <Star className="w-3 h-3" />
                            精华
                          </span>
                        )}
                        {hasNoReplies && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                            待回复
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-800 flex items-center justify-center text-white text-xs font-medium">
                            {post.user?.name.charAt(0)}
                          </div>
                          <span>{post.user?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(post.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{replyCount} 回复</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isInstructor && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleTogglePinned(post.id)}
                            className={cn(
                              'p-2 rounded-lg transition-colors',
                              post.isPinned
                                ? 'text-amber-600 bg-amber-50'
                                : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                            )}
                            title={post.isPinned ? '取消置顶' : '置顶'}
                          >
                            <Pin className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleToggleFeatured(post.id)}
                            className={cn(
                              'p-2 rounded-lg transition-colors',
                              post.isFeatured
                                ? 'text-teal-600 bg-teal-50'
                                : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50'
                            )}
                            title={post.isFeatured ? '取消精华' : '加精'}
                          >
                            <Star className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="pt-4 mb-6">
                      <div className="prose prose-sm max-w-none">
                        <MarkdownRenderer content={post.content} />
                      </div>
                    </div>

                    {(post.replies?.length || 0) > 0 && (
                      <div className="space-y-4 mb-6">
                        <h4 className="font-semibold text-gray-900">
                          回复 ({replyCount})
                        </h4>
                        {post.replies?.map((reply: DiscussionReply) => (
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
                                {reply.user?.role === 'instructor' && (
                                  <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded">
                                    讲师
                                  </span>
                                )}
                                <span className="text-sm text-gray-400">
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>
                              <div className="text-gray-600">
                                <MarkdownRenderer content={reply.content} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {currentUser?.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={replyContents[post.id] || ''}
                          onChange={(e) =>
                            setReplyContents(prev => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          placeholder="写下你的回复..."
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all resize-none"
                          rows={3}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handleCreateReply(post.id)}
                            disabled={
                              submittingReply === post.id ||
                              !replyContents[post.id]?.trim()
                            }
                            className="flex items-center gap-2 px-6 py-2 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            {submittingReply === post.id ? (
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
          })
        )}
      </div>

      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowNewPostModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">发布新帖子</h2>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标题
                </label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="请输入帖子标题"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  内容 (支持 Markdown)
                </label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="请输入帖子内容..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all resize-none"
                  rows={8}
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowNewPostModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreatePost}
                disabled={
                  submittingPost ||
                  !newPostTitle.trim() ||
                  !newPostContent.trim()
                }
                className="flex items-center gap-2 px-6 py-2 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {submittingPost ? (
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
