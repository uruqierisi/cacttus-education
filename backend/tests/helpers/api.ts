/**
 * HTTP helpers.
 *
 * The app is mounted with `createApp()` — never `server.ts` — so nothing binds a port.
 *
 * RATE LIMITING
 * -------------
 * `express-rate-limit` keys on `req.ip`, and the limiters are module-level singletons
 * shared by the whole run. Every helper therefore sends a UNIQUE `X-Forwarded-For` by
 * default (the app sets `trust proxy` to TRUST_PROXY_HOPS=1, so that header becomes
 * `req.ip`), which keeps unrelated tests out of each other's buckets. Tests that are
 * ABOUT the throttles pin a fixed `ip` on purpose.
 */
import request from 'supertest';
import type { Test } from 'supertest';
import { createApp } from '../../src/app';
import { REFRESH_COOKIE_NAME } from '../../src/config/constants';

export const app = createApp();

let ipCounter = 0;

/** A fresh, deterministic client IP for every request. */
export function nextIp(): string {
  ipCounter += 1;
  const third = Math.floor(ipCounter / 250) % 250;
  const fourth = (ipCounter % 250) + 1;
  return `10.20.${third}.${fourth}`;
}

export type RequestOptions = {
  /** Bearer access token. */
  readonly token?: string;
  /** Pin the client IP — only rate-limit tests should need this. */
  readonly ip?: string;
  /** Raw Cookie header value. */
  readonly cookie?: string;
  readonly origin?: string;
};

function decorate(test: Test, options: RequestOptions): Test {
  let next = test.set('X-Forwarded-For', options.ip ?? nextIp());

  if (options.token) {
    next = next.set('Authorization', `Bearer ${options.token}`);
  }
  if (options.cookie) {
    next = next.set('Cookie', options.cookie);
  }
  if (options.origin) {
    next = next.set('Origin', options.origin);
  }

  return next;
}

export const api = {
  get: (path: string, options: RequestOptions = {}): Test =>
    decorate(request(app).get(path), options),
  post: (path: string, options: RequestOptions = {}): Test =>
    decorate(request(app).post(path), options),
  patch: (path: string, options: RequestOptions = {}): Test =>
    decorate(request(app).patch(path), options),
  put: (path: string, options: RequestOptions = {}): Test =>
    decorate(request(app).put(path), options),
  delete: (path: string, options: RequestOptions = {}): Test =>
    decorate(request(app).delete(path), options),
  options: (path: string, options: RequestOptions = {}): Test =>
    decorate(request(app).options(path), options),
};

/** Pull the refresh cookie out of a `Set-Cookie` header, as a `Cookie` header value. */
export function refreshCookieFrom(headers: Record<string, unknown>): string | null {
  const raw = headers['set-cookie'];
  const list = Array.isArray(raw) ? (raw as string[]) : [];
  const found = list.find((cookie) => cookie.startsWith(`${REFRESH_COOKIE_NAME}=`));

  if (!found) {
    return null;
  }

  const [pair] = found.split(';');
  return pair ?? null;
}

/** The raw `Set-Cookie` entry for the refresh cookie, attributes included. */
export function rawRefreshCookie(headers: Record<string, unknown>): string | null {
  const raw = headers['set-cookie'];
  const list = Array.isArray(raw) ? (raw as string[]) : [];
  return list.find((cookie) => cookie.startsWith(`${REFRESH_COOKIE_NAME}=`)) ?? null;
}
