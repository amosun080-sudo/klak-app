import { create } from 'zustand';
import type { User, AuthTokens } from '../types/models';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;

  login: (tokens: AuthTokens, user: User) => void;
  loginDemo: (user: User) => void;
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
  isDemoMode: false,

  login: (tokens, user) => set({
    user,
    accessToken: tokens.accessToken,
    isAuthenticated: true,
    isLoading: false,
    isDemoMode: false,
  }),

  loginDemo: (user) => set({
    user,
    accessToken: 'demo-access-token',
    isAuthenticated: true,
    isLoading: false,
    isDemoMode: true,
  }),

  logout: () => set({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    isDemoMode: false,
  }),

  setAccessToken: (token) => set({ accessToken: token }),

  updateUser: (partial) => set((s) => ({
    user: s.user ? { ...s.user, ...partial } : null,
  })),

  setLoading: (v) => set({ isLoading: v }),
}));
