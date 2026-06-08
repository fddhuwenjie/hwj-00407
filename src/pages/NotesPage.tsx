import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Star,
  HelpCircle,
  Clock,
  Edit3,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  FileText,
  Filter,
  Tag,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  getMyNotes,
  getEnrollmentWithProgress,
  updateNote,
  deleteNote,
  exportCourseNotes,
} from '@/utils/api';
import { cn } from '@/lib/utils';
import type { Note, NoteTag, Enrollment, CourseProgress, Course } from '../../shared/types.js';

interface GroupedNotes {
  courseId: number;
  courseTitle: string;
  chapters: {
    chapterId: number;
    chapterTitle: string;
    notes: Note[];
  }[];
}

type TagFilter = 'all' | NoteTag;

const tagLabels: Record<NoteTag, string> = {
  normal: '普通',
  important: '重点',
  question: '疑问',
};

const tagColors: Record<NoteTag, string> = {
  normal: 'bg-gray-100 text-gray-600',
  important: 'bg-amber-100 text-amber-700',
  question: 'bg-red-100 text-red-700',
};

export default function NotesPage() {
  const { currentUser } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [enrollments, setEnrollments] = useState<Array<{ enrollment: Enrollment; progress: CourseProgress }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<number | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<TagFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTag, setEditTag] = useState<NoteTag>('normal');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [exportingCourseId, setExportingCourseId] = useState<number | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const enrollmentsData = await getEnrollmentWithProgress(currentUser.id);
        setEnrollments(enrollmentsData);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const loadNotes = async () => {
      const filters: { courseId?: number; tag?: string; search?: string } = {};
      if (selectedCourseId !== 'all') filters.courseId = selectedCourseId;
      if (selectedTag !== 'all') filters.tag = selectedTag;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      try {
        const data = await getMyNotes(filters);
        setNotes(data);
      } catch {
        setNotes([]);
      }
    };
    loadNotes();
  }, [selectedCourseId, selectedTag, searchQuery, currentUser]);

  const formatTime = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    const plainText = content.replace(/[#*`_~[\]()]/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.slice(0, maxLength) + '...';
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setEditContent(note.content);
    setEditTag(note.tag);
  };

  const handleSaveEdit = async () => {
    if (!editingNote || !editContent.trim()) return;
    setSubmittingEdit(true);
    try {
      const updated = await updateNote(editingNote.id, {
        content: editContent.trim(),
        tag: editTag,
      });
      setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)));
      setEditingNote(null);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('确定要删除这条笔记吗？')) return;
    try {
      await deleteNote(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      if (expandedNoteId === noteId) setExpandedNoteId(null);
    } catch (error) {
      console.error('删除笔记失败:', error);
    }
  };

  const handleExportNotes = async (courseId: number, courseTitle: string) => {
    setExportingCourseId(courseId);
    try {
      const result = await exportCourseNotes(courseId);
      const blob = new Blob([result.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename || `${courseTitle}-笔记.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExportingCourseId(null);
    }
  };

  const courses = useMemo(() => {
    return enrollments
      .map(e => e.enrollment.course)
      .filter((c): c is Course => c !== undefined);
  }, [enrollments]);

  const groupedNotes = useMemo(() => {
    const groups: Map<number, GroupedNotes> = new Map();

    notes.forEach(note => {
      const course = note.course;
      const chapter = note.lesson?.chapter;

      if (!course) return;

      if (!groups.has(course.id)) {
        groups.set(course.id, {
          courseId: course.id,
          courseTitle: course.title,
          chapters: [],
        });
      }

      const courseGroup = groups.get(course.id)!;

      if (chapter) {
        let chapterGroup = courseGroup.chapters.find(ch => ch.chapterId === chapter.id);
        if (!chapterGroup) {
          chapterGroup = {
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            notes: [],
          };
          courseGroup.chapters.push(chapterGroup);
        }
        chapterGroup.notes.push(note);
      } else {
        let uncategorizedChapter = courseGroup.chapters.find(ch => ch.chapterId === -1);
        if (!uncategorizedChapter) {
          uncategorizedChapter = {
            chapterId: -1,
            chapterTitle: '未分类',
            notes: [],
          };
          courseGroup.chapters.push(uncategorizedChapter);
        }
        uncategorizedChapter.notes.push(note);
      }
    });

    return Array.from(groups.values());
  }, [notes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-800 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的笔记</h1>
          <p className="text-gray-500">管理和查看你的课程笔记</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent">
              <option value="all">全部课程</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-400" />
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {(['all', 'normal', 'important', 'question'] as TagFilter[]).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors',
                    selectedTag === tag
                      ? 'bg-blue-800 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  )}>
                  {tag === 'all' ? '全部' : tagLabels[tag]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索笔记内容..."
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {groupedNotes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无笔记</h3>
          <p className="text-gray-500 mb-4">
            {selectedCourseId !== 'all' || selectedTag !== 'all' || searchQuery.trim()
              ? '没有找到符合条件的笔记，试试调整筛选条件'
              : '你还没有添加任何笔记，在学习时随时记录你的想法吧'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedNotes.map((group) => (
            <div key={group.courseId} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-800" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{group.courseTitle}</h2>
                    <p className="text-sm text-gray-500">
                      共 {group.chapters.reduce((sum, ch) => sum + ch.notes.length, 0)} 条笔记
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleExportNotes(group.courseId, group.courseTitle)}
                  disabled={exportingCourseId === group.courseId}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 font-medium rounded-xl hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {exportingCourseId === group.courseId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  导出笔记
                </button>
              </div>

              <div className="space-y-3">
                {group.chapters.map((chapter) => (
                  <div key={chapter.chapterId} className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-500 px-2">
                      {chapter.chapterTitle}
                    </h3>
                    <div className="space-y-2">
                      {chapter.notes.map((note) => {
                        const isExpanded = expandedNoteId === note.id;
                        const timeFormatted = formatTime(note.timePoint);

                        return (
                          <div
                            key={note.id}
                            className={cn(
                              'bg-white rounded-2xl shadow-sm border transition-all duration-300',
                              isExpanded ? 'border-blue-800 ring-2 ring-blue-800/20' : 'border-gray-100'
                            )}>
                            <div
                              onClick={() => setExpandedNoteId(isExpanded ? null : note.id)}
                              className="p-6 cursor-pointer">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 flex-wrap mb-2">
                                    <h4 className="font-semibold text-gray-900">
                                      {note.lesson?.title || '未命名课时'}
                                    </h4>
                                    {note.tag === 'important' && (
                                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                                        <Star className="w-3 h-3 fill-current" />
                                        重点
                                      </span>
                                    )}
                                    {note.tag === 'question' && (
                                      <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                        <HelpCircle className="w-3 h-3 fill-current" />
                                        疑问
                                      </span>
                                    )}
                                    {timeFormatted && (
                                      <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                        <Clock className="w-3 h-3" />
                                        {timeFormatted}
                                      </span>
                                    )}
                                  </div>

                                  {!isExpanded && (
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                      {truncateContent(note.content)}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                                    <span>{formatDate(note.createdAt)}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleEditNote(note)}
                                    className="p-2 text-gray-400 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="编辑笔记">
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="删除笔记">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <div className="prose prose-sm max-w-none">
                                    <MarkdownRenderer content={note.content} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setEditingNote(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">编辑笔记</h2>
              <button
                onClick={() => setEditingNote(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签
                </label>
                <div className="flex gap-2">
                  {(['normal', 'important', 'question'] as NoteTag[]).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setEditTag(tag)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors border',
                        editTag === tag
                          ? tagColors[tag] + ' border-transparent'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      )}>
                      {tag === 'important' && <Star className="w-4 h-4 fill-current" />}
                      {tag === 'question' && <HelpCircle className="w-4 h-4 fill-current" />}
                      {tagLabels[tag]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  内容 (支持 Markdown)
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="请输入笔记内容..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all resize-none"
                  rows={10}
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 p-6 border-t border-gray-100">
              <button
                onClick={() => setEditingNote(null)}
                className="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={submittingEdit || !editContent.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                {submittingEdit ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  '保存'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
