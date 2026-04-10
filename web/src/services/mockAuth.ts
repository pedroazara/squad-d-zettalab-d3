export type UserProfileType = 'public' | 'researcher' | 'farmer' | 'other';

export interface MockUserPreferences {
  favoriteBiome: string;
  favoriteState: string;
  defaultExport: 'CSV' | 'JSON' | 'XLSX';
}

export interface MockSessionUser {
  id: string;
  fullName: string;
  email: string;
  profileType: UserProfileType;
  createdAt: string;
  preferences: MockUserPreferences;
}

interface StoredUser extends MockSessionUser {
  password: string;
}

interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  profileType: UserProfileType;
}

interface AuthResult {
  ok: boolean;
  message: string;
  user?: MockSessionUser;
}

const USERS_KEY = 'guarawatch_mock_users';
const SESSION_KEY = 'guarawatch_mock_session';

const defaultPreferences: MockUserPreferences = {
  favoriteBiome: 'Cerrado',
  favoriteState: 'Mato Grosso',
  defaultExport: 'CSV',
};

const seededUser: StoredUser = {
  id: 'demo-user-1',
  fullName: 'Usuario Demo',
  email: 'usuario@demo.com',
  password: '123456',
  profileType: 'researcher',
  createdAt: new Date('2026-01-01T10:00:00.000Z').toISOString(),
  preferences: defaultPreferences,
};

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify([seededUser]));
      return [seededUser];
    }
    const parsed = JSON.parse(raw) as StoredUser[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(USERS_KEY, JSON.stringify([seededUser]));
      return [seededUser];
    }
    return parsed;
  } catch {
    localStorage.setItem(USERS_KEY, JSON.stringify([seededUser]));
    return [seededUser];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function toSessionUser(user: StoredUser): MockSessionUser {
  const { password: _password, ...sessionUser } = user;
  return sessionUser;
}

function saveSession(user: MockSessionUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getCurrentUser(): MockSessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as MockSessionUser;
  } catch {
    return null;
  }
}

export function logoutMockUser() {
  localStorage.removeItem(SESSION_KEY);
}

export function loginMockUser(email: string, password: string): AuthResult {
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const matchedUser = users.find(
    (user) => user.email.toLowerCase() === normalizedEmail && user.password === password
  );

  if (!matchedUser) {
    return {
      ok: false,
      message: 'E-mail ou senha invalidos. Tente o usuario demo: usuario@demo.com / 123456.',
    };
  }

  const sessionUser = toSessionUser(matchedUser);
  saveSession(sessionUser);
  return {
    ok: true,
    message: `Login realizado com sucesso. Bem-vindo, ${sessionUser.fullName}!`,
    user: sessionUser,
  };
}

export function registerMockUser(payload: RegisterPayload): AuthResult {
  const users = readUsers();
  const normalizedEmail = payload.email.trim().toLowerCase();

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return {
      ok: false,
      message: 'Ja existe uma conta com esse e-mail.',
    };
  }

  if (payload.password.length < 6) {
    return {
      ok: false,
      message: 'A senha deve ter ao menos 6 caracteres.',
    };
  }

  const user: StoredUser = {
    id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    fullName: payload.fullName.trim(),
    email: normalizedEmail,
    password: payload.password,
    profileType: payload.profileType,
    createdAt: new Date().toISOString(),
    preferences: defaultPreferences,
  };

  writeUsers([...users, user]);
  const sessionUser = toSessionUser(user);
  saveSession(sessionUser);
  return {
    ok: true,
    message: 'Conta criada com sucesso. Perfil mockado ativo.',
    user: sessionUser,
  };
}

export function updateCurrentUserProfile(
  updates: Partial<Pick<MockSessionUser, 'fullName' | 'profileType' | 'preferences'>>
): AuthResult {
  const current = getCurrentUser();
  if (!current) {
    return {
      ok: false,
      message: 'Nenhum usuario logado para atualizar.',
    };
  }

  const users = readUsers();
  const userIndex = users.findIndex((user) => user.id === current.id);

  if (userIndex < 0) {
    return {
      ok: false,
      message: 'Usuario nao encontrado na base mockada.',
    };
  }

  const updatedStoredUser: StoredUser = {
    ...users[userIndex],
    fullName: updates.fullName ?? users[userIndex].fullName,
    profileType: updates.profileType ?? users[userIndex].profileType,
    preferences: {
      ...users[userIndex].preferences,
      ...(updates.preferences ?? {}),
    },
  };

  users[userIndex] = updatedStoredUser;
  writeUsers(users);

  const updatedSessionUser = toSessionUser(updatedStoredUser);
  saveSession(updatedSessionUser);

  return {
    ok: true,
    message: 'Perfil atualizado com sucesso.',
    user: updatedSessionUser,
  };
}
