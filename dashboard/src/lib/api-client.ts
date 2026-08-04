/**
 * Axios instance shared by every API module.
 *
 * Responsibilities:
 *  - attach the in-memory access token to each request;
 *  - on a 401, transparently refresh ONCE and replay the original request;
 *  - de-duplicate concurrent refreshes so a burst of 401s triggers one round-trip;
 *  - when the REFRESH ITSELF is rejected, stop dead: clear auth state and redirect
 *    to /login rather than retrying.
 *
 * WHY THE LAST POINT MATTERS
 * --------------------------
 * Changing your own password bumps `passwordChangedAt` server-side, and `requireAuth`
 * refuses any token whose `iat` predates it. So the moment the change succeeds, BOTH
 * the access token and the refresh cookie are dead. The next call 401s, the refresh
 * fired to rescue it also 401s, and a naive interceptor would sit there refreshing
 * forever against an endpoint that can only ever answer 401.
 *
 * Three independent guards prevent that:
 *   1. `NO_RETRY_PATHS` — the refresh call is issued on a bare client and is also
 *      listed here, so a 401 from /api/auth/refresh can never re-enter refresh.
 *   2. `_hasRetried` — one replay per original request, never two.
 *   3. `isSessionExpired()` — a latch set the first time a refresh fails. Every later
 *      401 fails fast instead of starting refresh number N.
 */
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { config } from './config';
import { getAccessToken, setAccessToken } from './token-store';
import { expireSession, isSessionExpired } from './session';
import { toApiError } from './api-error';

const REQUEST_TIMEOUT_MS = 20_000;
const UNAUTHORIZED = 401;

/** Endpoints that must never trigger the refresh-and-retry loop. */
const NO_RETRY_PATHS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout'];

type RetryableConfig = InternalAxiosRequestConfig & { _hasRetried?: boolean };

export const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: REQUEST_TIMEOUT_MS,
  // Required so the browser sends the httpOnly refresh cookie to /api/auth/*.
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((request) => {
  const token = getAccessToken();

  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  return request;
});

/** A bare client for the refresh call itself — using apiClient would recurse. */
const refreshClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: true,
});

/**
 * The single in-flight refresh.
 *
 * Ten queries can 401 in the same tick after a token expires. Without this they would
 * fire ten refreshes, nine of which race to overwrite the token the tenth just set —
 * and each rotation invalidates the previous refresh cookie, so most of them would
 * lose. Sharing one promise means one round-trip and one rotation, and every waiting
 * request resumes with the same fresh token.
 */
let pendingRefresh: Promise<string | null> | null = null;

async function requestNewAccessToken(): Promise<string | null> {
  try {
    const response = await refreshClient.post<{ data?: { accessToken?: string } }>(
      '/api/auth/refresh',
    );
    const token = response.data?.data?.accessToken;

    if (!token) {
      // A 200 with no token is as unusable as a 401 — treat it the same way.
      expireSession();
      return null;
    }

    setAccessToken(token);
    return token;
  } catch {
    // THE REFRESH ITSELF FAILED. There is no third credential to fall back on, so the
    // session is over: clear it, tell React, and redirect to /login. Deliberately not
    // rethrowing — the caller already has the original error to surface.
    expireSession();
    return null;
  }
}

function refreshAccessToken(): Promise<string | null> {
  if (!pendingRefresh) {
    pendingRefresh = requestNewAccessToken().finally(() => {
      pendingRefresh = null;
    });
  }

  return pendingRefresh;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      throw toApiError(error);
    }

    const originalRequest = error.config as RetryableConfig;
    const url = originalRequest.url ?? '';

    const isRetryable =
      error.response?.status === UNAUTHORIZED &&
      // One replay per request, ever.
      !originalRequest._hasRetried &&
      // login / refresh / logout must never trigger a refresh — refresh least of all.
      !NO_RETRY_PATHS.some((path) => url.includes(path)) &&
      // A refresh already failed once. Everything after that is a lost cause.
      !isSessionExpired();

    if (!isRetryable) {
      throw toApiError(error);
    }

    originalRequest._hasRetried = true;
    const token = await refreshAccessToken();

    if (!token) {
      // `expireSession()` has already cleared state and started the redirect.
      throw toApiError(error);
    }

    originalRequest.headers.Authorization = `Bearer ${token}`;
    return apiClient.request(originalRequest);
  },
);

/** Unwrap the `{ success, data, meta }` envelope. */
export type ApiEnvelope<T> = {
  readonly success: true;
  readonly data: T;
  readonly meta?: PaginationMeta;
};

export type PaginationMeta = {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
};

export type Paginated<T> = {
  readonly items: readonly T[];
  readonly meta: PaginationMeta;
};

const EMPTY_META: PaginationMeta = { page: 1, pageSize: 0, total: 0, totalPages: 0 };

export async function getData<T>(url: string, options?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<ApiEnvelope<T>>(url, options);
  return response.data.data;
}

export async function getPaginated<T>(
  url: string,
  options?: AxiosRequestConfig,
): Promise<Paginated<T>> {
  const response = await apiClient.get<ApiEnvelope<readonly T[]>>(url, options);
  return {
    items: response.data.data,
    meta: response.data.meta ?? EMPTY_META,
  };
}

export async function postData<T>(
  url: string,
  body?: unknown,
  options?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.post<ApiEnvelope<T>>(url, body, options);
  return response.data.data;
}

export async function patchData<T>(url: string, body?: unknown): Promise<T> {
  const response = await apiClient.patch<ApiEnvelope<T>>(url, body);
  return response.data.data;
}

export async function deleteData(url: string): Promise<void> {
  await apiClient.delete(url);
}

export { refreshAccessToken };
