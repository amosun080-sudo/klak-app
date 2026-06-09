/**
 * Smart retry strategy — Issue #5 from code review.
 * Retries on network errors, timeouts, rate limits, and 5xx.
 * Never retries on 4xx (client errors) or in demo/offline mode.
 */
import axios from 'axios';

export const getRetryDelay = (attempt: number): number =>
  Math.min(1000 * Math.pow(2, attempt), 10_000); // 1s → 2s → 4s → max 10s

export const shouldRetry = (error: unknown, attempt: number): boolean => {
  if (attempt >= 3) return false;
  if (!axios.isAxiosError(error)) return false;

  const status = error.response?.status;

  // No response = network error → retry
  if (!status) return true;

  // Retry on timeout (408), rate limit (429), server errors (5xx)
  return status === 408 || status === 429 || status >= 500;
};
