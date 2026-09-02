import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import { Role } from '@prisma/client';
import {
  AUDIT_ENTITY_TYPES,
  UNKNOWN_ACTOR_ROLE,
  auditContextForActor,
  auditContextFromRequest,
  auditOrigin,
  sanitizeAuditMetadata,
  unknownActor,
} from '../../src/lib/audit';
import { REDACTED_PLACEHOLDER } from '../../src/lib/redact';
import { ApiError } from '../../src/lib/api-error';

function fakeRequest(overrides: Partial<Request> = {}): Request {
  return {
    ip: '10.20.30.40',
    headers: { 'user-agent': 'vitest/1.0' },
    ...overrides,
  } as unknown as Request;
}

describe('sanitizeAuditMetadata', () => {
  it('returns undefined for null / undefined', () => {
    expect(sanitizeAuditMetadata(undefined)).toBeUndefined();
    expect(sanitizeAuditMetadata(null)).toBeUndefined();
  });

  it('drops a non-plain-object payload', () => {
    expect(sanitizeAuditMetadata(['a'])).toBeUndefined();
    expect(sanitizeAuditMetadata('string')).toBeUndefined();
    expect(sanitizeAuditMetadata(42)).toBeUndefined();
  });

  it('redacts a denied key rather than storing its value', () => {
    const result = sanitizeAuditMetadata({ password: 'plaintext-secret', slug: 'ok' });

    expect(result).toEqual({ password: REDACTED_PLACEHOLDER, slug: 'ok' });
    expect(JSON.stringify(result)).not.toContain('plaintext-secret');
  });

  it('redacts a denied key nested one level down', () => {
    const result = sanitizeAuditMetadata({ input: { newPassword: 'nested-secret' } });

    expect(JSON.stringify(result)).not.toContain('nested-secret');
  });

  it('redacts a secret-SHAPED value under an innocent key', () => {
    const hash = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.7Q3qBYlj4S7WhVOoUAsdWzUJv6xX3zK';
    const result = sanitizeAuditMetadata({ note: hash });

    expect(result).toEqual({ note: REDACTED_PLACEHOLDER });
  });

  it('truncates a long string', () => {
    const result = sanitizeAuditMetadata({ note: 'x'.repeat(500) }) as Record<string, string>;

    expect(result.note).toHaveLength(201);
    expect(result.note.endsWith('…')).toBe(true);
  });

  it('caps the number of keys', () => {
    const input = Object.fromEntries(
      Array.from({ length: 40 }, (_value, index) => [`k${index}`, index]),
    );

    expect(Object.keys(sanitizeAuditMetadata(input) as object)).toHaveLength(20);
  });

  it('truncates below the depth bound', () => {
    const result = sanitizeAuditMetadata({ a: { b: { c: { d: 1 } } } });

    expect(JSON.stringify(result)).toContain('[truncated]');
  });

  it('normalises scalars: Date to ISO, non-finite number to null, booleans kept', () => {
    const result = sanitizeAuditMetadata({
      at: new Date('2026-08-03T00:00:00.000Z'),
      nan: Number.NaN,
      infinite: Number.POSITIVE_INFINITY,
      flag: false,
      missing: undefined,
    });

    expect(result).toEqual({
      at: '2026-08-03T00:00:00.000Z',
      nan: null,
      infinite: null,
      flag: false,
      missing: null,
    });
  });

  it('stringifies values Postgres could not store', () => {
    const result = sanitizeAuditMetadata({ big: 10n, fn: () => 1 }) as Record<string, string>;

    expect(result.big).toBe('10');
    expect(typeof result.fn).toBe('string');
  });

  it('sanitises array members and caps their length', () => {
    const result = sanitizeAuditMetadata({
      list: Array.from({ length: 30 }, (_value, index) => index),
    }) as Record<string, unknown[]>;

    expect(result.list).toHaveLength(20);
  });
});

describe('auditOrigin', () => {
  it('captures ip and user agent', () => {
    expect(auditOrigin(fakeRequest())).toEqual({ ip: '10.20.30.40', userAgent: 'vitest/1.0' });
  });

  it('returns nulls when neither is present', () => {
    const request = fakeRequest({ ip: undefined, headers: {} } as Partial<Request>);

    expect(auditOrigin(request)).toEqual({ ip: null, userAgent: null });
  });

  it('truncates an absurd user agent', () => {
    const request = fakeRequest({ headers: { 'user-agent': 'u'.repeat(2000) } } as Partial<Request>);

    expect((auditOrigin(request).userAgent as string).length).toBe(513);
  });
});

describe('auditContextFromRequest', () => {
  it('snapshots the authenticated principal', () => {
    const request = fakeRequest({
      auth: { id: 'u1', email: 'admin@cacttus.test', role: Role.ADMIN },
    } as Partial<Request>);

    expect(auditContextFromRequest(request)).toEqual({
      actorId: 'u1',
      actorEmail: 'admin@cacttus.test',
      actorRole: Role.ADMIN,
      ip: '10.20.30.40',
      userAgent: 'vitest/1.0',
    });
  });

  it('fails loudly when the route forgot requireAuth', () => {
    try {
      auditContextFromRequest(fakeRequest());
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(500);
    }
  });
});

describe('unknownActor', () => {
  it('records the attempted email with a null actorId and the lowest role', () => {
    expect(unknownActor('attacker@example.com')).toEqual({
      actorId: null,
      actorEmail: 'attacker@example.com',
      actorRole: UNKNOWN_ACTOR_ROLE,
    });
    expect(UNKNOWN_ACTOR_ROLE).toBe(Role.EDITOR);
  });

  it('truncates an oversized attempted email', () => {
    expect(unknownActor('e'.repeat(400)).actorEmail).toHaveLength(201);
  });
});

describe('auditContextForActor', () => {
  it('merges an explicit actor with the request origin', () => {
    const context = auditContextForActor(fakeRequest(), {
      actorId: null,
      actorEmail: 'x@y.z',
      actorRole: Role.EDITOR,
    });

    expect(context).toEqual({
      actorId: null,
      actorEmail: 'x@y.z',
      actorRole: Role.EDITOR,
      ip: '10.20.30.40',
      userAgent: 'vitest/1.0',
    });
  });
});

describe('AUDIT_ENTITY_TYPES', () => {
  it('mirrors the vocabulary documented on the schema', () => {
    expect([...AUDIT_ENTITY_TYPES]).toEqual([
      'Form',
      'Submission',
      'User',
      'Post',
      'Auth',
      'Training',
      'TrainingCategory',
    ]);
  });
});
