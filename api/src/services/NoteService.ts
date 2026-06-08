import { Op } from 'sequelize';
import { Note, User, Course, Lesson, Chapter } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Note as NoteType, NoteTag } from '../../../shared/types.js';

interface NoteFilters {
  courseId?: number;
  tag?: string;
  search?: string;
}

interface CreateNoteData {
  courseId: number;
  lessonId: number;
  content: string;
  timePoint?: number;
  tag?: NoteTag;
}

interface UpdateNoteData {
  content?: string;
  tag?: NoteTag;
}

interface NoteWithAssociations extends Omit<NoteType, 'course' | 'lesson'> {
  course?: { id: number; title: string };
  lesson?: { id: number; title: string };
}

class NoteService {
  async createNote(userId: number, data: CreateNoteData): Promise<NoteType> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const course = await Course.findByPk(data.courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const lesson = await Lesson.findByPk(data.lessonId);
      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      const note = await Note.create({
        userId,
        courseId: data.courseId,
        lessonId: data.lessonId,
        content: data.content,
        timePoint: data.timePoint,
        tag: data.tag || 'normal',
      });

      return note as unknown as NoteType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create note', 500);
    }
  }

  async updateNote(noteId: number, userId: number, data: UpdateNoteData): Promise<NoteType> {
    try {
      const note = await Note.findByPk(noteId);
      if (!note) {
        throw new AppError('Note not found', 404);
      }

      if (note.userId !== userId) {
        throw new AppError('Unauthorized to update this note', 403);
      }

      await note.update({
        content: data.content ?? note.content,
        tag: data.tag ?? note.tag,
      });

      return note as unknown as NoteType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update note', 500);
    }
  }

  async deleteNote(noteId: number, userId: number): Promise<void> {
    try {
      const note = await Note.findByPk(noteId);
      if (!note) {
        throw new AppError('Note not found', 404);
      }

      if (note.userId !== userId) {
        throw new AppError('Unauthorized to delete this note', 403);
      }

      await note.destroy();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete note', 500);
    }
  }

  async getNotesByUser(userId: number, filters?: NoteFilters): Promise<NoteWithAssociations[]> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const whereClause: Record<string, any> = { userId };

      if (filters?.courseId) {
        whereClause.courseId = filters.courseId;
      }

      if (filters?.tag) {
        whereClause.tag = filters.tag;
      }

      if (filters?.search) {
        whereClause.content = {
          [Op.like]: `%${filters.search}%`,
        };
      }

      const notes = await Note.findAll({
        where: whereClause,
        include: [
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'title'],
          },
          {
            model: Lesson,
            as: 'lesson',
            attributes: ['id', 'title'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return notes.map(note => note.toJSON()) as NoteWithAssociations[];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch notes', 500);
    }
  }

  async getNotesByLesson(userId: number, lessonId: number): Promise<NoteWithAssociations[]> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const lesson = await Lesson.findByPk(lessonId);
      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      const notes = await Note.findAll({
        where: { userId, lessonId },
        include: [
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'title'],
          },
          {
            model: Lesson,
            as: 'lesson',
            attributes: ['id', 'title'],
          },
        ],
        order: [['timePoint', 'ASC'], ['createdAt', 'DESC']],
      });

      return notes.map(note => note.toJSON()) as NoteWithAssociations[];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch lesson notes', 500);
    }
  }

  async exportNotesByCourse(userId: number, courseId: number): Promise<string> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const course = await Course.findByPk(courseId, {
        include: [
          {
            model: Chapter,
            as: 'chapters',
            include: [
              {
                model: Lesson,
                as: 'lessons',
              },
            ],
          },
        ],
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      const notes = await Note.findAll({
        where: { userId, courseId },
        include: [
          {
            model: Lesson,
            as: 'lesson',
            attributes: ['id', 'title', 'chapterId'],
          },
        ],
        order: [['createdAt', 'ASC']],
      });

      if (notes.length === 0) {
        return `# ${course.title} - 学习笔记\n\n暂无笔记`;
      }

      const tagLabels: Record<string, string> = {
        normal: '📝 普通',
        important: '⭐ 重要',
        question: '❓ 疑问',
      };

      const notesByLesson = new Map<number, NoteType[]>();
      notes.forEach(note => {
        const noteData = note.toJSON() as NoteType;
        if (!notesByLesson.has(note.lessonId)) {
          notesByLesson.set(note.lessonId, []);
        }
        notesByLesson.get(note.lessonId)!.push(noteData);
      });

      const chapters = (course as any).chapters || [];
      chapters.sort((a: any, b: any) => a.order - b.order);

      let markdown = `# ${course.title} - 学习笔记\n\n`;
      markdown += `> 导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
      markdown += `> 笔记总数: ${notes.length}\n\n`;
      markdown += `---\n\n`;

      for (const chapter of chapters) {
        const chapterLessons = chapter.lessons || [];
        chapterLessons.sort((a: any, b: any) => a.order - b.order);

        const chapterHasNotes = chapterLessons.some((lesson: any) => notesByLesson.has(lesson.id));
        if (!chapterHasNotes) continue;

        markdown += `## 第 ${chapter.order} 章: ${chapter.title}\n\n`;

        for (const lesson of chapterLessons) {
          const lessonNotes = notesByLesson.get(lesson.id);
          if (!lessonNotes || lessonNotes.length === 0) continue;

          markdown += `### ${lesson.title}\n\n`;

          for (const note of lessonNotes) {
            if (note.timePoint !== undefined && note.timePoint !== null) {
              const minutes = Math.floor(note.timePoint / 60);
              const seconds = note.timePoint % 60;
              markdown += `**时间点**: ${minutes}:${seconds.toString().padStart(2, '0')}\n\n`;
            }

            markdown += `**标签**: ${tagLabels[note.tag] || note.tag}\n\n`;
            markdown += `${note.content}\n\n`;

            if (lessonNotes.indexOf(note) < lessonNotes.length - 1) {
              markdown += `---\n\n`;
            }
          }

          markdown += `\n`;
        }
      }

      return markdown.trim();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to export notes', 500);
    }
  }
}

export default new NoteService();
