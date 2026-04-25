import { useState, useCallback } from 'react';
import { ApiError, ApiErrorHandler, ErrorType } from '@/services/errorHandling';

interface UseApiErrorState {
  error: ApiError | null;
  isLoading: boolean;
}

interface UseApiErrorReturn extends UseApiErrorState {
  setError: (error: unknown) => void;
  clearError: () => void;
  handleRetry: () => void;
  userMessage: string;
  isRetryable: boolean;
  shouldRedirectToLogin: boolean;
}

export const useApiError = (retryAction?: () => void): UseApiErrorReturn => {
  const [state, setState] = useState<UseApiErrorState>({
    error: null,
    isLoading: false
  });

  const setError = useCallback((error: unknown) => {
    const apiError = ApiErrorHandler.classifyError(error);
    setState({ error: apiError, isLoading: false });
    
    // Auto-redirect to login on authentication errors
    if (ApiErrorHandler.shouldRedirectToLogin(apiError)) {
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }
  }, []);

  const clearError = useCallback(() => {
    setState({ error: null, isLoading: false });
  }, []);

  const handleRetry = useCallback(() => {
    if (state.error && ApiErrorHandler.isRetryableError(state.error)) {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Execute retry action if provided
      if (retryAction) {
        retryAction();
      } else {
        // Default retry: reload page
        window.location.reload();
      }
    }
  }, [state.error, retryAction]);

  const userMessage = state.error 
    ? ApiErrorHandler.getUserFriendlyMessage(state.error)
    : '';

  const isRetryable = state.error 
    ? ApiErrorHandler.isRetryableError(state.error)
    : false;

  const shouldRedirectToLogin = state.error 
    ? ApiErrorHandler.shouldRedirectToLogin(state.error)
    : false;

  return {
    ...state,
    setError,
    clearError,
    handleRetry,
    userMessage,
    isRetryable,
    shouldRedirectToLogin
  };
};

// Hook for async operations with automatic error handling
export const useAsyncOperation = <T, Args extends any[]>(
  asyncFn: (...args: Args) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
    retryAction?: () => void;
  }
) => {
  const [state, setState] = useState<{
    data: T | null;
    error: ApiError | null;
    isLoading: boolean;
  }>({
    data: null,
    error: null,
    isLoading: false
  });

  const execute = useCallback(async (...args: Args) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await asyncFn(...args);
      setState({ data: result, error: null, isLoading: false });
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      const apiError = ApiErrorHandler.classifyError(error);
      setState(prev => ({ ...prev, error: apiError, isLoading: false }));
      options?.onError?.(apiError);
      
      // Auto-redirect to login on authentication errors
      if (ApiErrorHandler.shouldRedirectToLogin(apiError)) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
      
      throw apiError;
    }
  }, [asyncFn, options]);

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  const retry = useCallback(() => {
    if (state.error && ApiErrorHandler.isRetryableError(state.error)) {
      // Re-execute with the same arguments if we have them stored
      // This is a simplified retry - in practice you might want to store the last args
      // For now, we'll call retryAction if provided, or just clear the error
      if (options?.retryAction) {
        options.retryAction();
      } else {
        setState(prev => ({ ...prev, error: null }));
      }
    } else if (options?.retryAction) {
      options.retryAction();
    }
  }, [state.error, options?.retryAction]);

  return {
    data: state.data,
    error: state.error,
    isLoading: state.isLoading,
    execute,
    reset,
    retry,
    userMessage: state.error ? ApiErrorHandler.getUserFriendlyMessage(state.error) : '',
    isRetryable: state.error ? ApiErrorHandler.isRetryableError(state.error) : false
  };
};
