import axios, { AxiosError } from 'axios';
import type { ApiErrorShape } from '@/types/api';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

const apiClient = axios.create({
  // In dev, empty baseURL routes through Vite proxy and avoids CORS preflight issues.
  baseURL: configuredBaseUrl || undefined,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 30000),
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('guarawatch_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getApiErrorMessage = (error: unknown): string => {
  if (!(error instanceof AxiosError)) {
    return 'Erro inesperado na comunicacao com a API.';
  }

  const data = error.response?.data as ApiErrorShape | undefined;

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

  return error.message || 'Falha ao comunicar com o backend.';
};

export default apiClient;
