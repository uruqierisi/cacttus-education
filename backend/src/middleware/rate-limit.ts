/**
 * Rate limiting.
 *
 * Three tiers, because the threat models differ: credential stuffing on login, spam
 * on the public form endpoint, and accidental hammering from the dashboard.
 *
 * The default in-memory store is per-instance. It is correct for a single Railway
 * container; if the API is ever scaled horizontally, swap in a Redis store here —
 * this is the only file that would change.
 */
import rateLimit, { type Options } from 'express-rate-limit';
import { env } from '../config/env';
import { CSV_RATE_LIMIT, ERROR_CODE, HTTP_STATUS } from '../config/constants';
import type { ErrorBody } from '../lib/api-response';

const TOO_MANY_REQUESTS_BODY: ErrorBody = {
  success: false,
  error: {
    code: ERROR_CODE.RATE_LIMITED,
    message: 'Too many requests. Please slow down and try again later.',
    details: [],
  },
};

const sharedOptions: Partial<Options> = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  message: TOO_MANY_REQUESTS_BODY,
};

/** Blanket limit applied to the whole `/api` surface. */
export const apiRateLimiter = rateLimit({
  ...sharedOptions,
  windowMs: env.API_RATE_LIMIT_WINDOW_MS,
  limit: env.API_RATE_LIMIT_MAX,
});

/** Tight limit on credential endpoints; successful logins are not counted. */
export const authRateLimiter = rateLimit({
  ...sharedOptions,
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  limit: env.LOGIN_RATE_LIMIT_MAX,
  skipSuccessfulRequests: true,
});

/**
 * Bulk CSV export/import, tighter than the blanket API limit.
 *
 * These endpoints are authenticated, so this is not anti-spam — it bounds blast radius.
 * One export call reads thousands of leads' PII and one import writes thousands of rows;
 * capping them well below the general limit means a stolen staff token can be used to
 * siphon or flood the inbox only slowly enough for the audit trail to be noticed.
 */
export const csvRateLimiter = rateLimit({
  ...sharedOptions,
  windowMs: CSV_RATE_LIMIT.WINDOW_MS,
  limit: CSV_RATE_LIMIT.MAX,
});

/** Anti-spam limit on the unauthenticated form-submission endpoint. */
export const publicSubmitRateLimiter = rateLimit({
  ...sharedOptions,
  windowMs: env.PUBLIC_RATE_LIMIT_WINDOW_MS,
  limit: env.PUBLIC_RATE_LIMIT_MAX,
});
