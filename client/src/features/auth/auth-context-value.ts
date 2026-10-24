import { createContext } from 'react';
import type { LoginInput, RegisterInput, User } from '@/api/types';

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** True while a stored token is being verified on first load. */
  isLoading: boolean;
  login(input: LoginInput): Promise<User>;
  register(input: RegisterInput): Promise<User>;
  logout(): void;
  setUser(user: User): void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
