/**
 * Refresh-cookie handling.
 *
 * The refresh token lives in an httpOnly, SameSite cookie scoped to `/api/auth`, so
 * XSS in the dashboard cannot read it and no other endpoint ever receives it.
 */
import type { CookieOptions, Response } from 'express';
import { env } from '../config/env';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH } from '../config/constants';

const MS_PER_SECOND = 1_000;
const SECONDS_PER = { ms: 0.001, s: 1, m: 60, h: 3_600, d: 86_400 } as const;

type DurationUnit = keyof typeof SECONDS_PER;

/** Convert a `jsonwebtoken`-style duration ("7d", "15m") into milliseconds. */
export function durationToMs(duration: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(duration);
  if (!match) {
    throw new Error(`Unsupported duration string: ${duration}`);
  }

  const amount = Number.parseInt(match[1] as string, 10);
  const unit = match[2] as DurationUnit;
  return amount * SECONDS_PER[unit] * MS_PER_SECOND;
}

function baseOptions(): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: REFRESH_COOKIE_PATH,
  };

  if (env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN;
  }

  return options;
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...baseOptions(),
    maxAge: durationToMs(env.REFRESH_TOKEN_TTL),
  });
}

/** Clearing must use the exact same attributes or the browser keeps the old cookie. */
export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, baseOptions());
}
