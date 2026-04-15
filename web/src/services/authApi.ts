import apiClient from '@/services/apiClient';
import type {
  AuthResponse,
  BackendUserPublic,
  SessionUser,
  UserCreatePayload,
  UserLoginPayload,
} from '@/types/api';

const TOKEN_KEY = 'guarawatch_auth_token';
const USER_KEY = 'guarawatch_session_user';

const mapBackendUserToSessionUser = (user: BackendUserPublic): SessionUser => ({
  id: user.id,
  fullName: user.name,
  email: user.email,
  organization: user.organization,
  role: user.role,
});

export const saveSession = (token: string, user: BackendUserPublic) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(mapBackendUserToSessionUser(user)));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getSessionUser = (): SessionUser | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return Boolean(localStorage.getItem(TOKEN_KEY));
};

export const login = async (payload: UserLoginPayload): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  saveSession(data.token, data.user);
  return data;
};

export const register = async (payload: UserCreatePayload): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  saveSession(data.token, data.user);
  return data;
};
