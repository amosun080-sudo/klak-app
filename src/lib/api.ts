import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/auth';
import { errorReporter } from './errorReporter';
import { env } from './env';

const BASE_URL = env.apiBaseUrl;
console.log('[API] Base URL:', BASE_URL);

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
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
      return 'Server is taking too long to respond. It may be warming up — please try again in a moment.';
    }
    if (!err.response) {
      if (Platform.OS === 'web' && err.code === 'ERR_NETWORK') {
        return 'Network request blocked. If running locally, ensure the backend is running and CORS allows this origin.';
      }
      return 'Could not connect to the server. Check your network connection.';
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
  const method = config.method?.toUpperCase() ?? 'GET';
  console.log(`[API] --> ${method} ${config.baseURL ?? ''}${config.url ?? ''}`, token ? '(auth)' : '(no token)');
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

  // Raw axios bypasses the response interceptor, so unwrap the envelope manually
  const { data: raw } = await axios.post<any>(
    `${BASE_URL}/api/v1/auth/refresh`,
    { refreshToken },
    { timeout: 10_000 },
  );
  const payload = (raw?.success && raw?.data) ? raw.data : raw;

  const newAccess  = payload.accessToken;
  const newRefresh = payload.refreshToken;

  useAuthStore.getState().setAccessToken(newAccess);
  await setRefreshToken(newRefresh);
  return newAccess;
}

api.interceptors.response.use(
  (res) => {
    const method = res.config.method?.toUpperCase() ?? 'GET';
    console.log(`[API] <-- ${res.status} ${method} ${res.config.url ?? ''}`);
    // Unwrap { success, data, timestamp } envelope used by the backend
    if (res.data && typeof res.data === 'object' && 'success' in res.data && 'data' in res.data) {
      res.data = res.data.data;
    }
    return res;
  },
  async (error: AxiosError) => {
    const original: RetryableConfig = (error.config as RetryableConfig) ?? {};
    const method = original.method?.toUpperCase() ?? 'GET';
    const url = original.url ?? 'unknown';

    if (error.code === 'ECONNABORTED') {
      console.warn(`[API] TIMEOUT ${method} ${url}${original._retry ? ' (retry exhausted)' : ' — retrying once'}`);
    } else if (!error.response) {
      console.error(`[API] NETWORK ERROR ${method} ${url}`, { code: error.code, message: error.message });
    } else {
      console.warn(`[API] <-- ${error.response.status} ${method} ${url}`, error.response.data);
    }

    // Report API errors to telemetry
    if (error.response?.status && error.response.status >= 500) {
      errorReporter.captureApiError(error, url);
    }

    // Retry once on timeout — handles Render free-tier cold starts (~30-60s spin-up)
    if (error.code === 'ECONNABORTED' && !original._retry) {
      original._retry = true;
      return api(original);
    }

    // Handle rate limiting (429)
    if (error.response?.status === 429 && !original._retry) {
      original._retry = true;
      const retryAfter = parseInt(error.response.headers['retry-after'] ?? '60', 10);
      console.warn(`[API] Rate limited. Retrying after ${retryAfter}s`);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return api(original);
    }

    // Only attempt refresh on 401, and only once per request
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      // No refresh token means this is a bad-credentials 401 (e.g. wrong password on login).
      // Pass the error through so the calling screen can show the right message.
      const existingRt = await getRefreshToken();
      if (!existingRt) {
        console.log('[API] 401 with no refresh token — passing through (bad credentials)');
        return Promise.reject(error);
      }

      console.log('[API] 401 received — attempting token refresh');
      try {
        if (!pendingRefresh) {
          pendingRefresh = refreshAccessToken().finally(() => {
            pendingRefresh = null;
          });
        }

        const newToken = await pendingRefresh;
        console.log('[API] Token refreshed — retrying original request');
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        console.error('[API] Token refresh failed — logging out', refreshError);
        await clearRefreshToken();
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
