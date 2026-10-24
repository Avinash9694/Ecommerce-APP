import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import type { LoginInput, RegisterInput, User } from '@/api';
import { getToken, onTokenChange, setToken } from '@/api/session';
import { AuthContext } from './auth-context-value';
import type { AuthContextValue } from './auth-context-value';

const ME_QUERY_KEY = ['me'] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(getToken);

  useEffect(() => onTokenChange(setTokenState), []);

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => api.auth.me(),
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    // A rejected token (expired, account removed) signs the user out.
    if (meQuery.isError && token) setToken(null);
  }, [meQuery.isError, token]);

  const applySession = useCallback(
    (user: User, nextToken: string) => {
      setToken(nextToken);
      queryClient.setQueryData(ME_QUERY_KEY, user);
      // Cart and orders belong to the previous session, if any.
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    [queryClient],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await api.auth.login(input);
      applySession(result.user, result.token);
      return result.user;
    },
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const result = await api.auth.register(input);
      applySession(result.user, result.token);
      return result.user;
    },
    [applySession],
  );

  const logout = useCallback(() => {
    setToken(null);
    queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
    queryClient.removeQueries({ queryKey: ['cart'] });
    queryClient.removeQueries({ queryKey: ['orders'] });
    queryClient.removeQueries({ queryKey: ['admin'] });
  }, [queryClient]);

  const setUser = useCallback(
    (user: User) => queryClient.setQueryData(ME_QUERY_KEY, user),
    [queryClient],
  );

  const user = token ? (meQuery.data ?? null) : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'admin',
      isLoading: Boolean(token) && meQuery.isPending,
      login,
      register,
      logout,
      setUser,
    }),
    [user, token, meQuery.isPending, login, register, logout, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
