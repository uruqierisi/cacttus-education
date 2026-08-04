import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/context/auth-context';

/** Throws rather than returning null so a mis-nested component fails immediately. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>.');
  }

  return context;
}
