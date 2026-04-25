import { AxiosError } from 'axios';
import type { ApiErrorShape } from '@/types/api';

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ApiError {
  type: ErrorType;
  message: string;
  statusCode?: number;
  originalError?: unknown;
  retryable: boolean;
}

export class ApiErrorHandler {
  static classifyError(error: unknown): ApiError {
    if (!(error instanceof AxiosError)) {
      return {
        type: ErrorType.UNKNOWN_ERROR,
        message: 'Erro inesperado na comunicação com a API.',
        retryable: false,
        originalError: error
      };
    }

    const statusCode = error.response?.status;
    const data = error.response?.data as ApiErrorShape | undefined;

    // Network errors
    if (!error.response && error.code === 'ECONNABORTED') {
      return {
        type: ErrorType.TIMEOUT_ERROR,
        message: 'A conexão com o servidor expirou. Tente novamente.',
        statusCode,
        retryable: true,
        originalError: error
      };
    }

    if (!error.response) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: 'Erro de conexão com o servidor. Verifique sua internet.',
        statusCode,
        retryable: true,
        originalError: error
      };
    }

    // HTTP status code based classification
    switch (statusCode) {
      case 401:
        return {
          type: ErrorType.AUTHENTICATION_ERROR,
          message: this.extractValidationMessage(data) || 'Credenciais inválidas. Verifique seu email e senha.',
          statusCode,
          retryable: false,
          originalError: error
        };

      case 403:
        return {
          type: ErrorType.AUTHORIZATION_ERROR,
          message: 'Você não tem permissão para acessar este recurso.',
          statusCode,
          retryable: false,
          originalError: error
        };

      case 404:
        return {
          type: ErrorType.NOT_FOUND_ERROR,
          message: 'Recurso não encontrado.',
          statusCode,
          retryable: false,
          originalError: error
        };

      case 422:
        return {
          type: ErrorType.VALIDATION_ERROR,
          message: this.extractValidationMessage(data) || 'Dados inválidos.',
          statusCode,
          retryable: false,
          originalError: error
        };

      case 429:
        return {
          type: ErrorType.SERVER_ERROR,
          message: 'Muitas tentativas. Aguarde um momento e tente novamente.',
          statusCode,
          retryable: true,
          originalError: error
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: ErrorType.SERVER_ERROR,
          message: 'Erro no servidor. Tente novamente em alguns minutos.',
          statusCode,
          retryable: true,
          originalError: error
        };

      default:
        return {
          type: ErrorType.UNKNOWN_ERROR,
          message: this.extractValidationMessage(data) || 'Erro desconhecido.',
          statusCode,
          retryable: statusCode ? statusCode >= 500 : true,
          originalError: error
        };
    }
  }

  private static extractValidationMessage(data: ApiErrorShape | undefined): string | null {
    if (typeof data?.detail === 'string') {
      return data.detail;
    }

    if (Array.isArray(data?.detail) && data?.detail.length > 0) {
      const firstMessage = data.detail[0]?.msg;
      if (firstMessage) {
        return firstMessage;
      }
    }

    if (data?.message) {
      return data.message;
    }

    return null;
  }

  static isRetryableError(error: ApiError): boolean {
    return error.retryable;
  }

  static shouldRedirectToLogin(error: ApiError): boolean {
    return error.type === ErrorType.AUTHENTICATION_ERROR;
  }

  static getUserFriendlyMessage(error: ApiError): string {
    return error.message;
  }
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000
};

export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: unknown;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        const apiError = ApiErrorHandler.classifyError(error);
        
        // Don't retry if error is not retryable or if we've exhausted retries
        if (!ApiErrorHandler.isRetryableError(apiError) || attempt === finalConfig.maxRetries) {
          throw apiError;
        }

        // Calculate delay for next retry
        const delay = Math.min(
          finalConfig.retryDelay * Math.pow(finalConfig.backoffMultiplier, attempt),
          finalConfig.maxDelay
        );

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError;
  }
}

// Error boundary for React components
export interface ErrorBoundaryState {
  hasError: boolean;
  error: ApiError | null;
}

export class ErrorBoundaryHelper {
  static handleApiError(error: unknown): ErrorBoundaryState {
    const apiError = ApiErrorHandler.classifyError(error);
    
    return {
      hasError: true,
      error: apiError
    };
  }

  static resetError(): ErrorBoundaryState {
    return {
      hasError: false,
      error: null
    };
  }
}
