/**
 * Analytics/Telemetry stub — Issue #14 from code review.
 * Replace console.log calls with Firebase Analytics or Mixpanel.
 */

export const analytics = {
  trackEvent: (event: string, params?: Record<string, unknown>): void => {
    // TODO: Replace with FirebaseAnalytics.logEvent(event, params)
    if (__DEV__) {
      console.log('[ANALYTICS]', event, params ?? {});
    }
  },

  trackScreenView: (screenName: string): void => {
    analytics.trackEvent('screen_view', { screen_name: screenName });
  },

  trackError: (error: Error, context?: string): void => {
    analytics.trackEvent('error', {
      message: error.message,
      context: context ?? 'unknown',
    });
  },

  trackAuth: (event: 'login' | 'logout' | 'register' | 'otp_verify', method?: string): void => {
    analytics.trackEvent(`auth_${event}`, { method: method ?? 'phone' });
  },

  trackTransaction: (event: 'view' | 'recategorise', txId: string): void => {
    analytics.trackEvent(`transaction_${event}`, { transaction_id: txId });
  },
};
