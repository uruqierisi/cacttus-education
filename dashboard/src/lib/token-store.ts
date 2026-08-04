/**
 * In-memory access-token store.
 *
 * The access token is deliberately NOT persisted to localStorage or sessionStorage —
 * anything readable by JavaScript is readable by an XSS payload. Session continuity
 * across a page reload comes from the httpOnly refresh cookie instead, which the
 * bootstrap `refresh()` call exchanges for a fresh access token.
 */
type Listener = (token: string | null) => void;

let accessToken: string | null = null;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  listeners.forEach((listener) => listener(token));
}

export function clearAccessToken(): void {
  setAccessToken(null);
}

/** Subscribe to token changes (used to broadcast a forced logout). */
export function onAccessTokenChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
