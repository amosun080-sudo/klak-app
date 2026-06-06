import axios, { AxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:3000';

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Token storage helpers (platform-aware) ────────────────────────────────────
export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('klak_rt') : null;
  }
  return SecureStore.getItemAsync('klak_rt');
}

export async function setRefreshToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem('klak_rt', token);
  } else {
    await SecureStore.setItemAsync('klak_rt', token);
  }
}

export async function clearRefreshToken(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem('klak_rt');
  } else {
    await SecureStore.deleteItemAsync('klak_rt').catch(() => {});
  }
}

// ── Extract error message from any Axios error ────────────────────────────────
export function getApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    if (err.response?.data?.error) return err.response.data.error;
    if (err.code === 'ECONNABORTED') {
      return 'Could not reach the server. If testing on a physical device, make sure EXPO_PUBLIC_API_BASE_URL in .env.local points to your PC\'s local IP (e.g. http://192.168.x.x:3000) — not 10.0.2.2 which only works in the Android emulator.';
    }
    if (!err.response) {
      return 'Could not connect to the server. Check that your backend is running and that EXPO_PUBLIC_API_BASE_URL is set to your PC\'s local IP address.';
    }
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

// ── Attach JWT on every request ───────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-refresh on 401 ───────────────────────────────────────────────────────
let isRefreshing = false;
let failQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failQueue = [];
}

interface RetryableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original: RetryableConfig = error.config ?? {};

    // Only attempt refresh on 401 and only once per request
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue the request until the ongoing refresh resolves
        return new Promise<string>((resolve, reject) => {
          failQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        // Use a plain axios call (not the intercepted instance) to avoid loops
        const { data } = await axios.post(
          `${BASE_URL}/api/v1/auth/refresh`,
          { refreshToken },
          { timeout: 10_000 },
        );

        const newAccess: string = data.data.accessToken;
        const newRefresh: string = data.data.refreshToken;

        useAuthStore.getState().setAccessToken(newAccess);
        await setRefreshToken(newRefresh);

        processQueue(null, newAccess);

        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        await clearRefreshToken();
        useAuthStore.getState().logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
