/**
 * CORS policy.
 *
 * Two very different consumers share this API:
 *   1. the admin dashboard  — credentialed (refresh cookie), full method surface;
 *   2. the marketing site   — no cookies, only the public read/submit endpoints.
 *
 * Both are handled by a single strict allowlist. Requests with no `Origin` header
 * (server-to-server, curl, health probes) are allowed through because the browser
 * same-origin policy is not what protects those paths — auth is.
 *
 * CREDENTIALS ARE PER-ORIGIN, NOT GLOBAL
 * --------------------------------------
 * `Access-Control-Allow-Credentials: true` is emitted ONLY for `env.credentialedOrigins`
 * (the dashboard). Being on `allowedOrigins` buys read access to the PUBLIC endpoints and
 * nothing else.
 *
 * This is not cosmetic. The refresh cookie is `SameSite=Strict`, and "site" is the
 * registrable domain — so in production the marketing origin (cacttus.education) and the
 * API (api.cacttus.education) are the SAME site and the browser will happily attach the
 * refresh cookie to a request the marketing page initiates. If the API also answered that
 * origin with `Allow-Credentials: true`, script running on the marketing site could POST
 * `/api/auth/refresh`, READ the response, and walk away with a live ADMIN access token.
 * The marketing site renders operator-authored HTML and is the more exposed of the two
 * codebases; an XSS there must not become an admin session here. It sends no cookies and
 * needs none, so denying it credentials costs nothing and closes that escalation path.
 */
import type { CorsOptions, CorsOptionsDelegate, CorsRequest } from 'cors';
import { env } from './env';
import { EXPORT_TRUNCATED_HEADER } from './constants';

const ALLOWED_METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'];
const ALLOWED_HEADERS = ['Content-Type', 'Authorization'];
// `Content-Disposition` carries the download filename; `X-Export-Truncated` tells the
// dashboard an export hit EXPORT_MAX_ROWS. Both are useless unless exposed — the browser
// hides every other response header from cross-origin JavaScript.
const EXPOSED_HEADERS = ['Content-Disposition', EXPORT_TRUNCATED_HEADER];

/** Cache preflight responses for 10 minutes to cut the OPTIONS chatter. */
const PREFLIGHT_MAX_AGE_SECONDS = 600;

/** Trailing slashes are stripped on both sides so `https://x/` matches `https://x`. */
function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, '');
}

const originChecker: CorsOptions['origin'] = (origin, callback) => {
  if (!origin) {
    callback(null, true);
    return;
  }

  if (env.allowedOrigins.includes(normalizeOrigin(origin))) {
    callback(null, true);
    return;
  }

  // Reject by *not* setting the header rather than throwing — a thrown error here
  // surfaces as an opaque 500 and hides the real cause from the browser console.
  callback(null, false);
};

/**
 * True only for an origin explicitly trusted with the refresh cookie.
 *
 * A missing `Origin` is never credentialed: no browser omits the header on a
 * cross-origin credentialed request, so the only callers here are non-browser clients
 * for which the header is meaningless anyway.
 */
export function isCredentialedOrigin(origin: string | undefined): boolean {
  return origin !== undefined && env.credentialedOrigins.includes(normalizeOrigin(origin));
}

/** The options applied to one request, with `credentials` decided by its `Origin`. */
export function corsOptionsForOrigin(origin: string | undefined): CorsOptions {
  return {
    origin: originChecker,
    credentials: isCredentialedOrigin(origin),
    methods: ALLOWED_METHODS,
    allowedHeaders: ALLOWED_HEADERS,
    exposedHeaders: EXPOSED_HEADERS,
    maxAge: PREFLIGHT_MAX_AGE_SECONDS,
    optionsSuccessStatus: 204,
  };
}

/**
 * Per-request delegate. `cors()` accepts this in place of a static options object, which
 * is what makes `credentials` a function of the caller rather than a constant.
 */
export const corsOptionsDelegate: CorsOptionsDelegate<CorsRequest> = (req, callback) => {
  const origin = req.headers.origin;
  callback(null, corsOptionsForOrigin(typeof origin === 'string' ? origin : undefined));
};
