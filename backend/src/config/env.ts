/**
 * Environment loading + validation.
 *
 * The process refuses to boot on an invalid or incomplete environment: a missing JWT
 * secret must be a startup crash, never a runtime 500 discovered in production.
 */
import 'dotenv/config';
import { z } from 'zod';

const MIN_SECRET_LENGTH = 32;
const DURATION_PATTERN = /^\d+(?:ms|s|m|h|d)$/;

const booleanFromString = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .refine((value) => ['true', 'false', '1', '0'].includes(value), {
    message: 'must be true or false',
  })
  .transform((value) => value === 'true' || value === '1');

const originSchema = z
  .string()
  .url({ message: 'must be an absolute URL, e.g. https://admin.cacttus.education' })
  .transform((value) => value.replace(/\/+$/, ''));

const positiveInt = (fallback: number) =>
  z.coerce.number().int().positive().default(fallback);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: positiveInt(4000),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    JWT_ACCESS_SECRET: z.string().min(MIN_SECRET_LENGTH),
    JWT_REFRESH_SECRET: z.string().min(MIN_SECRET_LENGTH),
    ACCESS_TOKEN_TTL: z.string().regex(DURATION_PATTERN).default('15m'),
    REFRESH_TOKEN_TTL: z.string().regex(DURATION_PATTERN).default('7d'),

    COOKIE_DOMAIN: z.string().optional(),
    COOKIE_SECURE: booleanFromString.default('false'),
    COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).default('strict'),

    DASHBOARD_ORIGIN: originSchema,
    MARKETING_ORIGIN: originSchema,
    EXTRA_ALLOWED_ORIGINS: z.string().default(''),

    /**
     * Where uploaded cover images are written. Relative paths resolve from the backend
     * working directory, so the `./uploads` default lands in `backend/uploads`.
     *
     * DEPLOYMENT: this MUST point outside the repo on a server, and must be a volume if
     * the API runs in Docker — see the deploy notes in README/UPLOADS.md. A path inside
     * the deployment directory is destroyed by the next release.
     */
    UPLOAD_DIR: z.string().trim().min(1).default('./uploads'),

    /**
     * Absolute, publicly reachable base URL of THIS API, used to build cover-image URLs.
     *
     * Absolute rather than relative on purpose: the marketing site is a different origin,
     * so a stored `/uploads/x.png` would resolve against the marketing host and 404.
     * Storing the absolute URL means the value in `Post.coverImage` renders anywhere.
     * The trade-off is that changing the API's public hostname invalidates stored URLs —
     * a one-off UPDATE, and the deploy notes call it out.
     */
    PUBLIC_API_URL: originSchema.default('http://localhost:4000'),

    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    LOGIN_RATE_LIMIT_MAX: positiveInt(10),
    LOGIN_RATE_LIMIT_WINDOW_MS: positiveInt(900_000),
    PUBLIC_RATE_LIMIT_MAX: positiveInt(20),
    PUBLIC_RATE_LIMIT_WINDOW_MS: positiveInt(900_000),
    API_RATE_LIMIT_MAX: positiveInt(300),
    API_RATE_LIMIT_WINDOW_MS: positiveInt(900_000),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(1),
  })
  .superRefine((value, ctx) => {
    if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET',
      });
    }

    if (value.NODE_ENV === 'production' && !value.COOKIE_SECURE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['COOKIE_SECURE'],
        message: 'COOKIE_SECURE must be true in production',
      });
    }

    if (value.COOKIE_SAMESITE === 'none' && !value.COOKIE_SECURE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['COOKIE_SAMESITE'],
        message: 'SameSite=None requires COOKIE_SECURE=true',
      });
    }
  });

function parseEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  return result.data;
}

const parsed = parseEnv();

function splitOrigins(raw: string): readonly string[] {
  return raw
    .split(',')
    .map((entry) => entry.trim().replace(/\/+$/, ''))
    .filter((entry) => entry.length > 0);
}

/** Frozen, fully-typed configuration object. Import this, never `process.env`. */
export const env = Object.freeze({
  ...parsed,
  isProduction: parsed.NODE_ENV === 'production',
  isDevelopment: parsed.NODE_ENV === 'development',
  /** Origins allowed to call the API with credentials + the public marketing origin. */
  allowedOrigins: Object.freeze([
    parsed.DASHBOARD_ORIGIN,
    parsed.MARKETING_ORIGIN,
    ...splitOrigins(parsed.EXTRA_ALLOWED_ORIGINS),
  ]),
  /** Only the dashboard is trusted with cookies; the marketing site is read/write-public. */
  credentialedOrigins: Object.freeze([parsed.DASHBOARD_ORIGIN]),
});

export type Env = typeof env;
