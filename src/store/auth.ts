import { create } from 'zustand';
import type { User, AuthTokens } from '../types/models';
import { cacheManager } from '../lib/cache';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (tokens: AuthTokens, user: User) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  updateUser: (partial: Partial<User>) => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: (tokens, user) => set({
    user,
    accessToken: tokens.accessToken,
    isAuthenticated: true,
    isLoading: false,
  }),

  logout: async () => {
    await cacheManager.clear();
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setAccessToken: (token) => set({ accessToken: token }),

  updateUser: (partial) => set((s) => ({
    user: s.user ? { ...s.user, ...partial } : null,
  })),

  setLoading: (v) => set({ isLoading: v }),
}));
