import { computed, Injectable, signal } from '@angular/core';
import {
  AuthResult,
  AuthUser,
  DEMO_USERS,
  LoginPayload,
  RegisterPayload,
  StoredUser,
} from './auth.models';

const USERS_STORAGE_KEY = 'cerrado-forca.users';
const SESSION_STORAGE_KEY = 'cerrado-forca.session';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly currentUserState = signal<AuthUser | null>(this.readSession());

  readonly currentUser = computed(() => this.currentUserState());
  readonly isAuthenticated = computed(() => this.currentUserState() !== null);

  login(payload: LoginPayload): AuthResult {
    const users = this.readUsers();
    const email = payload.email.trim().toLowerCase();
    const user = users.find((entry) => entry.email.toLowerCase() === email);

    if (!user || user.password !== payload.password) {
      return {
        success: false,
        message: 'Credenciais invalidas. Use um dos acessos demo ou crie um cadastro local.',
      };
    }

    this.startSession(user);
    return {
      success: true,
      message: 'Acesso realizado com sucesso.',
    };
  }

  register(payload: RegisterPayload): AuthResult {
    const users = this.readUsers();
    const normalizedEmail = payload.email.trim().toLowerCase();
    const alreadyExists = users.some((entry) => entry.email.toLowerCase() === normalizedEmail);

    if (alreadyExists) {
      return {
        success: false,
        message: 'Ja existe um usuario demo com este e-mail.',
      };
    }

    const newUser: StoredUser = {
      id: this.generateId(),
      name: payload.name.trim(),
      email: normalizedEmail,
      organization: payload.organization.trim(),
      role: payload.role,
      password: payload.password,
    };

    this.persistUsers([...users, newUser]);
    this.startSession(newUser);

    return {
      success: true,
      message: 'Cadastro criado com sucesso.',
    };
  }

  logout(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.currentUserState.set(null);
  }

  private startSession(user: StoredUser): void {
    const sessionUser = this.mapToAuthUser(user);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
    this.currentUserState.set(sessionUser);
  }

  private readUsers(): StoredUser[] {
    const rawValue = localStorage.getItem(USERS_STORAGE_KEY);

    if (!rawValue) {
      return [...DEMO_USERS];
    }

    try {
      const parsed = JSON.parse(rawValue) as StoredUser[];
      return Array.isArray(parsed) ? this.mergeUsers(parsed) : [...DEMO_USERS];
    } catch {
      return [...DEMO_USERS];
    }
  }

  private persistUsers(users: StoredUser[]): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  private readSession(): AuthUser | null {
    const rawValue = localStorage.getItem(SESSION_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as AuthUser;
    } catch {
      return null;
    }
  }

  private mapToAuthUser(user: StoredUser): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      organization: user.organization,
      role: user.role,
    };
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `user-${Date.now()}`;
  }

  private mergeUsers(users: StoredUser[]): StoredUser[] {
    const mergedUsers = new Map(
      DEMO_USERS.map((user) => [user.email.trim().toLowerCase(), user] as const),
    );

    for (const user of users) {
      mergedUsers.set(user.email.trim().toLowerCase(), user);
    }

    return [...mergedUsers.values()];
  }
}
