import { create } from 'zustand';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { User, AuthTokens } from '../types/models';
import { usersApi, getApiError } from '../lib/api/index';
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
  initializeFcm: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true, // Start with true for proper session restore

  login: (tokens, user) => set({
    user,
    accessToken: tokens.accessToken,
    isAuthenticated: true,
    isLoading: false,
  }),

  logout: async () => {
    // Clear all cached data on logout
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

  initializeFcm: async () => {
    try {
      // Only initialize on mobile platforms
      if (Platform.OS === 'web') {
        console.log('FCM: Skipping on web platform');
        return;
      }

      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('FCM: Notification permissions not granted');
        return;
      }

      // Get FCM token
      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
      });
      
      console.log('FCM: Got push token:', pushToken.data);

      // Send token to backend
      try {
        await usersApi.updateFcmToken(pushToken.data);
        console.log('FCM: Successfully updated token on backend');
      } catch (err) {
        console.error('FCM: Failed to update token on backend:', getApiError(err));
      }

      // Handle token refresh
      const subscription = Notifications.addPushTokenListener(({ data: newToken }) => {
        console.log('FCM: Token refreshed:', newToken);
        usersApi.updateFcmToken(newToken).catch(err => 
          console.error('FCM: Failed to update refreshed token:', getApiError(err))
        );
      });

      // Store subscription for cleanup (could be added to state if needed)
      return () => subscription.remove();
    } catch (err) {
      console.error('FCM: Initialization failed:', err);
    }
  },
}));
