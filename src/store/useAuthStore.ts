import { create } from 'zustand';
import type { User } from '../../shared/types.js';
import { getUsers, getUserById } from '../utils/api.js';

interface AuthState {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User | null) => void;
  login: (userId: number) => Promise<void>;
  logout: () => void;
  fetchUsers: () => Promise<void>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  users: [],

  setCurrentUser: (user) => set({ currentUser: user }),

  login: async (userId) => {
    localStorage.setItem('currentUserId', String(userId));
    const user = await getUserById(userId);
    set({ currentUser: user });
  },

  logout: () => {
    localStorage.removeItem('currentUserId');
    set({ currentUser: null });
  },

  fetchUsers: async () => {
    const users = await getUsers();
    set({ users });
  },

  init: async () => {
    const userId = localStorage.getItem('currentUserId');
    if (userId) {
      try {
        const user = await getUserById(Number(userId));
        set({ currentUser: user });
      } catch {
        localStorage.removeItem('currentUserId');
      }
    }
    const users = await getUsers();
    set({ users });
  },
}));
