// Utility functions for handling long-running API requests

export interface ApiRequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public isTimeout?: boolean,
    public isNetwork?: boolean
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function makeApiRequest(
  url: string,
  options: RequestInit,
  requestOptions: ApiRequestOptions = {}
): Promise<Response> {
  const {
    timeout = 3700000, // 1 hour + 5 minutes default
    retries = 1,
    retryDelay = 5000
  } = requestOptions;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timed out', 408, true);
        }
        
        if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
          throw new ApiError('Network connection failed', 503, false, true);
        }
      }

      // If this is the last attempt, throw the error
      if (attempt === retries) {
        throw new ApiError(
          error instanceof Error ? error.message : 'Unknown error',
          500
        );
      }

      // Wait before retrying
      if (attempt < retries) {
        console.log(`API request failed, retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${retries + 1})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError!;
}

export function createProgressTracker() {
  let startTime = Date.now();
  let lastUpdate = startTime;
  
  return {
    getElapsed: () => Math.floor((Date.now() - startTime) / 1000),
    getEstimatedRemaining: (progress: number) => {
      const elapsed = Date.now() - startTime;
      const estimated = elapsed / Math.max(progress, 0.01);
      return Math.floor((estimated - elapsed) / 1000);
    },
    update: (message?: string) => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const sinceLastUpdate = Math.floor((now - lastUpdate) / 1000);
      lastUpdate = now;
      
      console.log(`Progress update (${elapsed}s elapsed, +${sinceLastUpdate}s): ${message || 'Working...'}`);
    }
  };
}