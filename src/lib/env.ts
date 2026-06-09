/**
 * Environment variable validation — Issue #17 from code review.
 * Validates at startup so misconfigured builds fail fast with a clear message.
 */
import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_API_BASE_URL:      z.string().min(1, 'API base URL is required'),
  EXPO_PUBLIC_MONO_PUBLIC_KEY:   z.string().optional(),
  EXPO_PUBLIC_GOOGLE_CLIENT_ID:  z.string().optional(),
  EXPO_PUBLIC_APP_ENV:           z.enum(['development', 'production', 'demo']).optional(),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_API_BASE_URL:     process.env.EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_MONO_PUBLIC_KEY:  process.env.EXPO_PUBLIC_MONO_PUBLIC_KEY,
  EXPO_PUBLIC_GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  EXPO_PUBLIC_APP_ENV:          process.env.EXPO_PUBLIC_APP_ENV,
});

if (!parsed.success && __DEV__) {
  console.warn('[ENV] Missing or invalid environment variables:', parsed.error.format());
}

export const env = {
  apiBaseUrl:      process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:3000',
  monoPublicKey:   process.env.EXPO_PUBLIC_MONO_PUBLIC_KEY ?? '',
  googleClientId:  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '',
  appEnv:          (process.env.EXPO_PUBLIC_APP_ENV ?? 'development') as 'development' | 'production' | 'demo',
  isDev:           process.env.EXPO_PUBLIC_APP_ENV !== 'production',
};
