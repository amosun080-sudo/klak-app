/**
 * Smart retry strategy for API calls and React Query
 */

export interface RetryableError {
  response?: {
    status: number;
    data?: any;
  };
  code?: string;
  message?: string;
}

/**
 * Determine if an error should be retried
 */
export const shouldRetry = (error: RetryableError | Error | any, attempt: number): boolean => {
  // Don't retry more than 3 times
  if (attempt >= 3) return false;

  // Network errors - retry
  if (!error?.response && (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error'))) {
    return true;
  }

  // Timeout errors - retry
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return true;
  }

  // HTTP status codes that should be retried
  const status = error?.response?.status;
  if (status) {
    // Server errors (5xx) - retry
    if (status >= 500) return true;
    
    // Rate limiting (429) - retry with backoff
    if (status === 429) return true;
    
    // Client errors (4xx) - don't retry (except 429)
    if (status >= 400 && status < 500) return false;
  }

  // Unknown errors - don't retry by default
  return false;
};

/**
 * Calculate delay before next retry attempt (exponential backoff)
 */
export const getRetryDelay = (attempt: number): number => {
  // Base delay: 1000ms, 2000ms, 4000ms
  const baseDelay = 1000 * Math.pow(2, attempt);
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * baseDelay;
  
  return Math.min(baseDelay + jitter, 10000); // Cap at 10 seconds
};

/**
 * Retry wrapper for individual function calls
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (!shouldRetry(error, attempt)) {
        throw error;
      }
      
      if (attempt < maxAttempts - 1) {
        const delay = getRetryDelay(attempt);
        console.log(`Retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};