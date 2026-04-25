import axios from 'axios';
import { ApiErrorHandler, RetryHandler } from './errorHandling';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const isDevMode = import.meta.env.DEV;

if (!configuredBaseUrl && !isDevMode) {
  throw new Error(
    'Configuracao invalida: defina VITE_API_BASE_URL para conectar ao backend publicado.'
  );
}

const apiClient = axios.create({
  // In local development, empty baseURL routes through Vite proxy.
  baseURL: configuredBaseUrl || undefined,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 30000),
});

// Request interceptor for authentication
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('guarawatch_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const apiError = ApiErrorHandler.classifyError(error);
    
    // Handle authentication errors by clearing local storage
    if (apiError.type === 'AUTHENTICATION_ERROR') {
      localStorage.removeItem('guarawatch_auth_token');
      localStorage.removeItem('guarawatch_session_user');
    }
    
    // Don't retry validation errors, auth errors, or not found errors
    if (!ApiErrorHandler.isRetryableError(apiError)) {
      throw apiError;
    }
    
    // For retryable errors, we'll let the calling code handle retry logic
    throw apiError;
  }
);

// Enhanced API methods with retry logic
export const apiWithRetry = {
  get: async (url: string, config?: any) => {
    return RetryHandler.withRetry(() => apiClient.get(url, config));
  },
  post: async (url: string, data?: any, config?: any) => {
    return RetryHandler.withRetry(() => apiClient.post(url, data, config));
  },
  put: async (url: string, data?: any, config?: any) => {
    return RetryHandler.withRetry(() => apiClient.put(url, data, config));
  },
  delete: async (url: string, config?: any) => {
    return RetryHandler.withRetry(() => apiClient.delete(url, config));
  }
};

// Legacy error message function for backward compatibility
export const getApiErrorMessage = (error: unknown): string => {
  const apiError = ApiErrorHandler.classifyError(error);
  return ApiErrorHandler.getUserFriendlyMessage(apiError);
};

// Enhanced error handling utilities
export const handleApiError = (error: unknown) => {
  const apiError = ApiErrorHandler.classifyError(error);
  
  // Auto-redirect to login on authentication errors
  if (ApiErrorHandler.shouldRedirectToLogin(apiError)) {
    window.location.href = '/login';
    return;
  }
  
  return apiError;
};

export const isRetryableError = (error: unknown): boolean => {
  const apiError = ApiErrorHandler.classifyError(error);
  return ApiErrorHandler.isRetryableError(apiError);
};

export default apiClient;
