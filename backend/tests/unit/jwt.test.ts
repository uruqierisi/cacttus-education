import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import {
  extractBearerToken,
  isTokenStale,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../src/lib/jwt';
import { env } from '../../src/config/env';
import { JWT_AUDIENCE, JWT_ISSUER } from '../../src/config/constants';
import { ApiError } from '../../src/lib/api-error';

const claims = { sub: 'user-1', email: 'admin@cacttus.test', role: Role.ADMIN } as const;

describe('access and refresh tokens', () => {
  it('round-trips an access token with its claims intact', () => {
    const verified = verifyAccessToken(signAccessToken(claims));

    expect(verified).toMatchObject({ ...claims, typ: 'access' });
    expect(typeof verified.iat).toBe('number');
  });

  it('round-trips a refresh token', () => {
    expect(verifyRefreshToken(signRefreshToken(claims))).toMatchObject({
      ...claims,
      typ: 'refresh',
    });
  });

  it('refuses to verify an access token as a refresh token', () => {
    expect(() => verifyRefreshToken(signAccessToken(claims))).toThrow(ApiError);
  });

  it('refuses a token whose typ claim is wrong even when the signature is valid', () => {
    const forged = jwt.sign({ ...claims, typ: 'access' }, env.JWT_REFRESH_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: '5m',
    });

    expect(() => verifyRefreshToken(forged)).toThrow(/Token is invalid/);
  });

  it('rejects a tampered signature', () => {
    const token = signAccessToken(claims);
    const tampered = `${token.slice(0, -3)}abc`;

    expect(() => verifyAccessToken(tampered)).toThrow(/Token is invalid/);
  });

  it('rejects a token signed with a foreign secret', () => {
    const foreign = jwt.sign({ ...claims, typ: 'access' }, 'x'.repeat(48), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: '5m',
    });

    expect(() => verifyAccessToken(foreign)).toThrow(/Token is invalid/);
  });

  it('rejects a wrong issuer or audience', () => {
    const wrongIssuer = jwt.sign({ ...claims, typ: 'access' }, env.JWT_ACCESS_SECRET, {
      issuer: 'someone-else',
      audience: JWT_AUDIENCE,
      expiresIn: '5m',
    });

    expect(() => verifyAccessToken(wrongIssuer)).toThrow(/Token is invalid/);
  });

  it('reports an expired token distinctly', () => {
    const expired = jwt.sign({ ...claims, typ: 'access' }, env.JWT_ACCESS_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: '-1s',
    });

    expect(() => verifyAccessToken(expired)).toThrow(/Token has expired/);
  });

  it('surfaces every failure as a 401, never a 500', () => {
    try {
      verifyAccessToken('garbage');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as ApiError).status).toBe(401);
    }
  });
});

describe('extractBearerToken', () => {
  it('extracts the token from a well-formed header', () => {
    expect(extractBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
  });

  it('is scheme-case insensitive', () => {
    expect(extractBearerToken('bearer abc')).toBe('abc');
    expect(extractBearerToken('BEARER abc')).toBe('abc');
  });

  it.each([
    undefined,
    '',
    'abc',
    'Basic abc',
    'Bearer',
    'Bearer ',
    'Bearer abc def',
  ])('returns null for %j', (header) => {
    expect(extractBearerToken(header as string | undefined)).toBeNull();
  });
});

describe('isTokenStale', () => {
  it('is stale when issued before the password change', () => {
    const changedAt = new Date('2026-08-03T12:00:00.000Z');
    const issuedBefore = Math.floor(changedAt.getTime() / 1000) - 1;

    expect(isTokenStale(issuedBefore, changedAt)).toBe(true);
  });

  it('is not stale when issued at or after the password change', () => {
    const changedAt = new Date('2026-08-03T12:00:00.000Z');
    const issuedAt = Math.floor(changedAt.getTime() / 1000);

    expect(isTokenStale(issuedAt, changedAt)).toBe(false);
    expect(isTokenStale(issuedAt + 1, changedAt)).toBe(false);
  });
});
