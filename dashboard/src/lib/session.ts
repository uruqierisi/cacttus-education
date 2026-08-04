/**
 * Session-death broadcast.
 *
 * There is exactly one situation this module exists for: the refresh token itself is
 * no longer accepted. That happens on logout elsewhere, on refresh-cookie expiry, and —
 * the case that motivated this file — immediately after the signed-in user changes
 * their own password, because the API bumps `passwordChangedAt` and every token issued
 * before that instant (access AND refresh) is refused on the very next request.
 *
 * When that happens the only correct behaviour is to stop: clear the token, tell React
 * to drop the authenticated user, and send the browser to /login. Retrying is
 * guaranteed to fail, so the `isExpired` latch below makes every subsequent request
 * fail fast instead of queueing another doomed refresh.
 *
 * This lives outside `api-client.ts` and outside the React tree so that both can depend
 * on it without either depending on the other.
 */
import { clearAccessToken } from './token-store';

type SessionExpiredHandler = () => void;

const handlers = new Set<SessionExpiredHandler>();

/** Latched the moment a refresh is rejected; cleared only by a successful login. */
let isExpired = false;

export const LOGIN_PATH = '/login';

/** Subscribe to forced logout. Returns the unsubscribe function. */
export function onSessionExpired(handler: SessionExpiredHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

/**
 * True once the refresh token has been rejected.
 *
 * The response interceptor reads this before attempting a refresh, which is what
 * guarantees a single failed refresh cannot turn into a refresh-per-request loop.
 */
export function isSessionExpired(): boolean {
  return isExpired;
}

/** Called after a successful login so the next 401 is allowed to refresh again. */
export function resetSessionExpiry(): void {
  isExpired = false;
}

/**
 * Tear the session down. Idempotent: repeated calls after the first are no-ops, so a
 * burst of in-flight requests all failing at once produces one redirect, not N.
 */
export function expireSession(): void {
  if (isExpired) {
    return;
  }

  isExpired = true;
  clearAccessToken();

  // React first: this flips <ProtectedRoute> to `unauthenticated` synchronously, so no
  // protected screen can paint with a dead session even for one frame.
  handlers.forEach((handler) => handler());

  // Then the hard redirect. Guarded so landing on /login does not bounce forever.
  if (typeof window !== 'undefined' && window.location.pathname !== LOGIN_PATH) {
    window.location.replace(LOGIN_PATH);
  }
}
