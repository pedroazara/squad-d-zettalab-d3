export type UserRole = 'coordenacao' | 'brigadista';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: UserRole;
}

export interface StoredUser extends AuthUser {
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  organization: string;
  role: UserRole;
  password: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
}

export const DEMO_USERS: ReadonlyArray<StoredUser> = [
  {
    id: 'demo-coordenacao',
    name: 'Ana Ribeiro',
    email: 'comando@cerradoforca.org',
    organization: 'Coordenacao Regional do Cerrado',
    role: 'coordenacao',
    password: 'cerrado123',
  },
  {
    id: 'demo-brigadista',
    name: 'Lucas Martins',
    email: 'brigada@cerradoforca.org',
    organization: 'Brigada Integrada do Cerrado',
    role: 'brigadista',
    password: 'brigada123',
  },
];
