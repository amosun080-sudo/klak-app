/**
 * Centralized error reporting for production monitoring.
 * Configure Sentry or similar service for production error tracking.
 */
import axios, { AxiosError } from 'axios';

export interface ErrorContext {
  endpoint?: string;
  userId?: string;
  timestamp?: Date;
  severity: 'low' | 'medium' | 'high';
  metadata?: Record<string, unknown>;
}

export const errorReporter = {
  captureException: (err: Error | unknown, context: ErrorContext): void => {
    const message = err instanceof Error ? err.message : String(err);
    
    // TODO: Replace with production error service like Sentry
    // Sentry.captureException(err, { extra: context })
    
    // For production, only log critical errors to avoid spam
    if (context.severity === 'high' || __DEV__) {
      console.error('[ERROR]', message, {
        ...context,
        timestamp: context.timestamp ?? new Date(),
      });
    }
  },

  captureApiError: (err: AxiosError, endpoint: string): void => {
    const severity = err.response?.status === 500 ? 'high' : 'medium';
    errorReporter.captureException(err, {
      endpoint,
      severity,
      timestamp: new Date(),
      metadata: {
        status: err.response?.status,
        url: err.config?.url,
        method: err.config?.method,
      },
    });
  },
};
