/**
 * JWT signing and verification.
 *
 * Two independent secrets and an explicit `typ` claim mean an access token can never
 * be presented at the refresh endpoint (or vice versa), even if one secret leaks.
 */
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env';
import { JWT_AUDIENCE, JWT_ISSUER, TOKEN_TYPE, type TokenType } from '../config/constants';
import { ApiError } from './api-error';

export type TokenClaims = {
  readonly sub: string;
  readonly email: string;
  readonly role: Role;
  readonly typ: TokenType;
  /** Issued-at, in SECONDS since epoch. Stamped automatically by `jsonwebtoken`. */
  readonly iat: number;
};

type SignedPayload = Omit<TokenClaims, 'typ' | 'iat'>;

function sign(payload: SignedPayload, typ: TokenType, secret: string, expiresIn: string): string {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  };
  return jwt.sign({ ...payload, typ }, secret, options);
}

export function signAccessToken(payload: SignedPayload): string {
  return sign(payload, TOKEN_TYPE.ACCESS, env.JWT_ACCESS_SECRET, env.ACCESS_TOKEN_TTL);
}

export function signRefreshToken(payload: SignedPayload): string {
  return sign(payload, TOKEN_TYPE.REFRESH, env.JWT_REFRESH_SECRET, env.REFRESH_TOKEN_TTL);
}

type VerifiedPayload = JwtPayload & TokenClaims;

function isTokenClaims(value: JwtPayload | string, expected: TokenType): value is VerifiedPayload {
  if (typeof value === 'string') {
    return false;
  }
  return (
    typeof value.sub === 'string' &&
    typeof value.email === 'string' &&
    typeof value.role === 'string' &&
    typeof value.iat === 'number' &&
    value.typ === expected
  );
}

function verify(token: string, secret: string, expected: TokenType): TokenClaims {
  let decoded: JwtPayload | string;

  try {
    decoded = jwt.verify(token, secret, { issuer: JWT_ISSUER, audience: JWT_AUDIENCE });
  } catch (error) {
    const message =
      error instanceof jwt.TokenExpiredError ? 'Token has expired.' : 'Token is invalid.';
    throw ApiError.unauthorized(message);
  }

  if (!isTokenClaims(decoded, expected)) {
    throw ApiError.unauthorized('Token is invalid.');
  }

  return {
    sub: decoded.sub,
    email: decoded.email,
    role: decoded.role,
    typ: decoded.typ,
    iat: decoded.iat,
  };
}

const MS_PER_SECOND = 1_000;

/**
 * True when the token was issued before the account's last credential change, i.e.
 * the session must be evicted.
 *
 * `iat` has one-second resolution, so `passwordChangedAt` is floored to seconds and
 * the comparison is strict. A token minted in the SAME second as the change survives;
 * that one-second window is the standard trade-off and is unreachable in practice
 * because neither change-password nor admin-reset issues tokens.
 */
export function isTokenStale(issuedAt: number, passwordChangedAt: Date): boolean {
  return issuedAt < Math.floor(passwordChangedAt.getTime() / MS_PER_SECOND);
}

export function verifyAccessToken(token: string): TokenClaims {
  return verify(token, env.JWT_ACCESS_SECRET, TOKEN_TYPE.ACCESS);
}

export function verifyRefreshToken(token: string): TokenClaims {
  return verify(token, env.JWT_REFRESH_SECRET, TOKEN_TYPE.REFRESH);
}

/** Extract a bearer token from the `Authorization` header, or null when absent/malformed. */
export function extractBearerToken(headerValue: string | undefined): string | null {
  if (!headerValue) {
    return null;
  }

  const [scheme, token, ...rest] = headerValue.split(' ');
  if (rest.length > 0 || scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token.trim() || null;
}
