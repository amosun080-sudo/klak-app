import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/auth';
import { errorReporter } from './errorReporter';
import { env } from './env';

const BASE_URL = env.apiBaseUrl;

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
      return 'Request timed out. Please check your connection.';
    }
    if (!err.response) {
      return 'Could not connect to the server. Check your API URL in .env.local.';
    }
    if (err.response.status === 401) return 'Session expired. Please log in again.';
    if (err.response.status === 403) return 'You do not have permission to do that.';
    if (err.response.status >= 500) return 'Server error. Please try again shortly.';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

// ── Attach JWT on every request ───────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auto-refresh on 401 — race-condition-safe ─────────────────────────────────
// FIX Issue #1: Use a single pending Promise instead of a mutable array queue.
// All concurrent 401s await the same refresh promise — no duplicate refreshes.
let pendingRefresh: Promise<string> | null = null;

interface RetryableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  // Backend returns { accessToken, refreshToken } directly — no data wrapper
  const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${BASE_URL}/api/v1/auth/refresh`,
    { refreshToken },
    { timeout: 10_000 },
  );

  const newAccess  = data.accessToken;
  const newRefresh = data.refreshToken;

  useAuthStore.getState().setAccessToken(newAccess);
  await setRefreshToken(newRefresh);
  return newAccess;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original: RetryableConfig = (error.config as RetryableConfig) ?? {};

    // Report API errors to telemetry
    const endpoint = error.config?.url ?? 'unknown';
    if (error.response?.status && error.response.status >= 500) {
      errorReporter.captureApiError(error, endpoint);
    }

    // Only attempt refresh on 401, and only once per request
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        // Ensure only ONE refresh happens at a time — all queued requests await the same promise
        if (!pendingRefresh) {
          pendingRefresh = refreshAccessToken().finally(() => {
            pendingRefresh = null;
          });
        }

        const newToken = await pendingRefresh;
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        await clearRefreshToken();
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
