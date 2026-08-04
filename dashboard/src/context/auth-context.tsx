/**
 * Authentication state for the whole SPA.
 *
 * On mount the provider attempts a silent refresh and then hydrates the profile from
 * `GET /api/auth/me`: if the httpOnly cookie is still valid the user lands back in the
 * dashboard without re-typing credentials, and if it is not, `status` settles on
 * `unauthenticated` and the router redirects to /login.
 *
 * The provider also subscribes to `onSessionExpired`, so a refresh rejected mid-session
 * (the classic case: the user just changed their own password, which invalidates every
 * token issued before that moment) drops the React user immediately rather than leaving
 * a signed-in shell rendering around dead credentials.
 */
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as authApi from '@/api/auth.api';
import { clearAccessToken, setAccessToken } from '@/lib/token-store';
import { onSessionExpired, resetSessionExpiry } from '@/lib/session';
import type { Role } from '@/lib/constants';
import type { User } from '@/api/types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AuthContextValue = {
  readonly status: AuthStatus;
  readonly user: User | null;
  readonly role: Role | null;
  readonly isAdmin: boolean;
  /** Resolves with the signed-in user so the caller can route by role immediately. */
  readonly login: (email: string, password: string) => Promise<User>;
  readonly logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async (): Promise<void> => {
      try {
        const session = await authApi.refreshSession();
        setAccessToken(session.accessToken);

        // `/me` is the authoritative profile: the refresh payload is a snapshot taken
        // when the token was minted, and a role change made since then must win.
        const current = await authApi.fetchCurrentUser();

        if (!isMounted) {
          return;
        }

        resetSessionExpiry();
        setUser(current);
        setStatus('authenticated');
      } catch {
        // No valid cookie is the normal first-visit path, not an error worth surfacing.
        if (!isMounted) {
          return;
        }
        clearAccessToken();
        setUser(null);
        setStatus('unauthenticated');
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Forced logout raised by the axios layer when a refresh is rejected.
  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null);
        setStatus('unauthenticated');
      }),
    [],
  );

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const session = await authApi.login({ email, password });
    setAccessToken(session.accessToken);
    // Re-arm the interceptor: a previous session may have latched the expiry flag.
    resetSessionExpiry();
    setUser(session.user);
    setStatus('authenticated');
    // Returned, not read from context: `user` in the caller's closure is still the
    // PREVIOUS render's value at this point, so an admin would be routed as if they
    // had no role at all.
    return session.user;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      // Local state is cleared even if the network call fails — the user asked to
      // leave, and the access token expires on its own regardless.
      clearAccessToken();
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      role: user?.role ?? null,
      isAdmin: user?.role === 'ADMIN',
      login,
      logout,
    }),
    [status, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
