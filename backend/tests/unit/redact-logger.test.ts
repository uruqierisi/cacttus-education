import { beforeEach, describe, expect, it } from 'vitest';
import {
  DENIED_KEYS,
  REDACTED_PLACEHOLDER,
  isDeniedKey,
  looksLikeSecretValue,
  normalizeKey,
} from '../../src/lib/redact';
import { logger } from '../../src/lib/logger';
import { capturedLogText, capturedLogs, clearCapturedLogs } from '../helpers/logs';

const BCRYPT_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.7Q3qBYlj4S7WhVOoUAsdWzUJv6xX3zK';
const JWT_LOOKALIKE = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJlLWhlcmU';

describe('normalizeKey', () => {
  it('squashes case and separators so one denylist entry covers every spelling', () => {
    expect(normalizeKey('X-Access-Token')).toBe('xaccesstoken');
    expect(normalizeKey('password_hash')).toBe('passwordhash');
    expect(normalizeKey('Set-Cookie')).toBe('setcookie');
  });
});

describe('isDeniedKey', () => {
  it.each([...DENIED_KEYS])('denies the listed key %j', (key) => {
    expect(isDeniedKey(key)).toBe(true);
  });

  it.each([
    'password',
    'Password',
    'password_hash',
    'currentPassword',
    'X-Access-Token',
    'refresh_token',
    'clientSecret',
    'apiKey',
    'Authorization',
    'authHeader',
    'x-auth-header',
    'sessionId',
    'privateKey',
    'otpCode',
    'mfaSecret',
    'passwd',
    'pwd',
    'signature',
  ])('denies %j through the fragment list', (key) => {
    expect(isDeniedKey(key)).toBe(true);
  });

  it.each(['authorId', 'author', 'slug', 'title', 'role', 'formSlug', 'count'])(
    'allows the benign key %j',
    (key) => {
      expect(isDeniedKey(key)).toBe(false);
    },
  );

  it('deliberately does NOT swallow authorId with a bare "auth" fragment', () => {
    expect(isDeniedKey('authorId')).toBe(false);
    expect(isDeniedKey('authorization')).toBe(true);
  });
});

describe('looksLikeSecretValue', () => {
  it('recognises a bcrypt hash arriving under an innocent key', () => {
    expect(looksLikeSecretValue(BCRYPT_HASH)).toBe(true);
  });

  it('recognises a JWT', () => {
    expect(looksLikeSecretValue(JWT_LOOKALIKE)).toBe(true);
  });

  it.each(['hello', 'arta@example.com', '$2a$12$tooshort', 'eyJ-not-a-jwt'])(
    'leaves %j alone',
    (value) => {
      expect(looksLikeSecretValue(value)).toBe(false);
    },
  );
});

describe('logger redaction', () => {
  beforeEach(() => {
    clearCapturedLogs();
  });

  it('redacts a denied key at the top level', () => {
    logger.warn('test', { password: 'hunter2-super-secret' });

    expect(capturedLogText()).not.toContain('hunter2-super-secret');
    expect(capturedLogText()).toContain(REDACTED_PLACEHOLDER);
  });

  it('redacts a denied key NESTED inside a context object', () => {
    logger.error('login failed', { input: { email: 'a@b.com', password: 'nested-secret-xyz' } });

    const text = capturedLogText();
    expect(text).not.toContain('nested-secret-xyz');
    expect(text).toContain('a@b.com');
  });

  it('redacts a secret-shaped VALUE under an innocent key', () => {
    logger.warn('token echo', { note: JWT_LOOKALIKE });

    expect(capturedLogText()).not.toContain(JWT_LOOKALIKE);
  });

  it('serialises Errors and Dates rather than flattening them to {}', () => {
    logger.warn('boom', { err: new Error('kaboom'), at: new Date('2026-08-03T00:00:00.000Z') });

    const text = capturedLogText();
    expect(text).toContain('kaboom');
    expect(text).toContain('2026-08-03T00:00:00.000Z');
  });

  it('truncates below the depth bound instead of recursing forever', () => {
    logger.warn('deep', { a: { b: { c: { d: { e: { f: 'too deep' } } } } } });

    expect(capturedLogText()).toContain('[truncated]');
  });

  it('walks arrays', () => {
    logger.warn('list', { items: [{ token: 'array-nested-secret' }] });

    expect(capturedLogText()).not.toContain('array-nested-secret');
  });

  it('writes errors to stderr and everything else to stdout', () => {
    logger.error('to stderr');
    logger.info('to stdout');

    const streams = capturedLogs().map((log) => log.stream);
    expect(streams).toContain('stderr');
    expect(streams).toContain('stdout');
  });

  it('emits a parseable structured entry', () => {
    logger.info('structured', { requestId: 'abc' });

    const entry = capturedLogs().at(-1)?.entry;
    expect(entry).toMatchObject({ level: 'info', message: 'structured', requestId: 'abc' });
    expect(typeof entry?.time).toBe('string');
  });

  it('accepts a call with no context', () => {
    logger.debug('bare');

    expect(capturedLogs().at(-1)?.entry).toMatchObject({ level: 'debug', message: 'bare' });
  });
});
