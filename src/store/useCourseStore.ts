import { create } from 'zustand';
import type { Course, CourseProgress } from '../../shared/types.js';
import {
  getCourses,
  getCourseById,
  enrollCourse,
  getCourseProgress,
  completeLesson,
} from '../utils/api.js';

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  currentProgress: CourseProgress | null;
  loading: boolean;
  fetchCourses: () => Promise<void>;
  fetchCourseById: (id: number) => Promise<void>;
  enrollCourse: (courseId: number) => Promise<void>;
  fetchProgress: (courseId: number) => Promise<void>;
  completeLesson: (lessonId: number, timeSpent: number) => Promise<void>;
  clearCurrentCourse: () => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  currentCourse: null,
  currentProgress: null,
  loading: false,

  fetchCourses: async () => {
    set({ loading: true });
    try {
      const courses = await getCourses();
      set({ courses });
    } finally {
      set({ loading: false });
    }
  },

  fetchCourseById: async (id: number) => {
    set({ loading: true });
    try {
      const course = await getCourseById(id);
      set({ currentCourse: course });
    } finally {
      set({ loading: false });
    }
  },

  enrollCourse: async (courseId: number) => {
    await enrollCourse(courseId);
    set((state) => ({
      courses: state.courses.map((c) =>
        c.id === courseId
          ? { ...c, _count: { enrollments: (c._count?.enrollments || 0) + 1 } }
          : c
      ),
    }));
  },

  fetchProgress: async (courseId: number) => {
    set({ loading: true });
    try {
      const progress = await getCourseProgress(courseId);
      set({ currentProgress: progress });
    } finally {
      set({ loading: false });
    }
  },

  completeLesson: async (lessonId: number, timeSpent: number) => {
    await completeLesson(lessonId, timeSpent);
  },

  clearCurrentCourse: () => {
    set({ currentCourse: null, currentProgress: null });
  },
}));
