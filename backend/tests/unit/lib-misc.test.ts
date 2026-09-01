import { describe, expect, it } from 'vitest';
import type { Response } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError, isApiError } from '../../src/lib/api-error';
import {
  buildPaginationMeta,
  sendCreated,
  sendCsv,
  sendError,
  sendSuccess,
} from '../../src/lib/api-response';
import { resolvePageParams, toPrismaPageArgs } from '../../src/lib/pagination';
import { durationToMs } from '../../src/lib/cookies';
import { hashPassword, verifyAgainstDummyHash, verifyPassword } from '../../src/lib/password';
import { sanitizeRichText, toExcerpt } from '../../src/lib/html';
import {
  isRecordNotFound,
  isUniqueViolation,
  uniqueViolationTargets,
} from '../../src/lib/prisma';
import { asyncHandler } from '../../src/lib/async-handler';
import { ERROR_CODE, EXPORT_TRUNCATED_HEADER, PAGINATION } from '../../src/config/constants';

function mockResponse() {
  const headers: Record<string, string> = {};
  const state: { status: number; body: unknown; sent: unknown } = {
    status: 0,
    body: undefined,
    sent: undefined,
  };

  const res = {
    setHeader(key: string, value: string) {
      headers[key] = String(value);
    },
    status(code: number) {
      state.status = code;
      return this;
    },
    json(body: unknown) {
      state.body = body;
      return this;
    },
    send(payload: unknown) {
      state.sent = payload;
      return this;
    },
  };

  return { res: res as unknown as Response, headers, state };
}

describe('ApiError', () => {
  it.each([
    ['badRequest', 400, ERROR_CODE.VALIDATION_FAILED],
    ['unauthorized', 401, ERROR_CODE.UNAUTHORIZED],
    ['forbidden', 403, ERROR_CODE.FORBIDDEN],
    ['notFound', 404, ERROR_CODE.NOT_FOUND],
    ['conflict', 409, ERROR_CODE.CONFLICT],
    ['internal', 500, ERROR_CODE.INTERNAL],
  ])('%s maps to %i / %s', (factory, status, code) => {
    const build = ApiError[factory as 'badRequest'] as (message: string) => ApiError;
    const error = build('message');

    expect(error.status).toBe(status);
    expect(error.code).toBe(code);
    expect(error.name).toBe('ApiError');
    expect(error.details).toEqual([]);
  });

  it('carries field-level details', () => {
    const error = ApiError.badRequest('nope', [{ field: 'body.slug', message: 'must be unique' }]);

    expect(error.details).toEqual([{ field: 'body.slug', message: 'must be unique' }]);
  });

  it('is recognised by isApiError, and a plain Error is not', () => {
    expect(isApiError(ApiError.notFound())).toBe(true);
    expect(isApiError(new Error('x'))).toBe(false);
    expect(isApiError(null)).toBe(false);
  });
});

describe('api-response', () => {
  it('sends a success envelope with a 200 by default', () => {
    const { res, state } = mockResponse();
    sendSuccess(res, { a: 1 });

    expect(state.status).toBe(200);
    expect(state.body).toEqual({ success: true, data: { a: 1 } });
  });

  it('includes pagination meta only when supplied', () => {
    const { res, state } = mockResponse();
    sendSuccess(res, [], 200, buildPaginationMeta(2, 20, 45));

    expect(state.body).toEqual({
      success: true,
      data: [],
      meta: { page: 2, pageSize: 20, total: 45, totalPages: 3 },
    });
  });

  it('sendCreated uses 201', () => {
    const { res, state } = mockResponse();
    sendCreated(res, { id: 'x' });

    expect(state.status).toBe(201);
  });

  it('sends an error envelope', () => {
    const { res, state } = mockResponse();
    sendError(res, 409, ERROR_CODE.CONFLICT, 'taken', [{ field: 'a', message: 'b' }]);

    expect(state.status).toBe(409);
    expect(state.body).toEqual({
      success: false,
      error: { code: 'CONFLICT', message: 'taken', details: [{ field: 'a', message: 'b' }] },
    });
  });

  it('sends a CSV with download headers and no truncation warning', () => {
    const { res, headers, state } = mockResponse();
    sendCsv(res, 'aplikimet-2026-08-03.csv', 'a,b');

    expect(headers['Content-Type']).toBe('text/csv; charset=utf-8');
    expect(headers['Content-Disposition']).toBe(
      'attachment; filename="aplikimet-2026-08-03.csv"',
    );
    expect(headers['Cache-Control']).toBe('no-store');
    expect(headers[EXPORT_TRUNCATED_HEADER]).toBeUndefined();
    expect(state.sent).toBe('a,b');
  });

  it('sets the truncation header when the export was cut off', () => {
    const { res, headers } = mockResponse();
    sendCsv(res, 'x.csv', 'a', true);

    expect(headers[EXPORT_TRUNCATED_HEADER]).toBe('true');
  });

  it('reports zero total pages for a zero page size', () => {
    expect(buildPaginationMeta(1, 0, 10).totalPages).toBe(0);
  });
});

describe('pagination', () => {
  it('falls back to the defaults for missing or nonsensical input', () => {
    for (const bad of [undefined, 0, -3, Number.NaN]) {
      expect(resolvePageParams(bad as number, bad as number)).toEqual({
        page: PAGINATION.DEFAULT_PAGE,
        pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
      });
    }
  });

  it('floors fractional values', () => {
    expect(resolvePageParams(2.9, 7.9)).toEqual({ page: 2, pageSize: 7 });
  });

  it('clamps the page size to the maximum', () => {
    expect(resolvePageParams(1, 10_000).pageSize).toBe(PAGINATION.MAX_PAGE_SIZE);
  });

  it('converts to Prisma skip/take', () => {
    expect(toPrismaPageArgs({ page: 3, pageSize: 20 })).toEqual({ skip: 40, take: 20 });
    expect(toPrismaPageArgs({ page: 1, pageSize: 20 })).toEqual({ skip: 0, take: 20 });
  });
});

describe('durationToMs', () => {
  it.each([
    ['500ms', 500],
    ['30s', 30_000],
    ['15m', 900_000],
    ['2h', 7_200_000],
    ['7d', 604_800_000],
  ])('converts %s', (input, expected) => {
    expect(durationToMs(input)).toBe(expected);
  });

  it('throws on an unsupported duration string', () => {
    expect(() => durationToMs('7 days')).toThrow(/Unsupported duration string/);
    expect(() => durationToMs('7w')).toThrow(/Unsupported duration string/);
  });
});

describe('password', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('CorrectHorse-9');

    expect(hash).not.toContain('CorrectHorse-9');
    expect(await verifyPassword('CorrectHorse-9', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('produces a different hash every time (salted)', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  it('always fails against the dummy hash', async () => {
    expect(await verifyAgainstDummyHash('anything')).toBe(false);
  });
});

describe('html sanitisation', () => {
  it('keeps allowed markup', () => {
    expect(sanitizeRichText('<p>Hello <strong>world</strong></p>')).toBe(
      '<p>Hello <strong>world</strong></p>',
    );
  });

  it('strips a script tag and its contents', () => {
    const clean = sanitizeRichText('<p>ok</p><script>alert(1)</script>');

    expect(clean).toBe('<p>ok</p>');
    expect(clean).not.toContain('alert');
  });

  it('strips an inline event handler', () => {
    expect(sanitizeRichText('<p onclick="steal()">x</p>')).toBe('<p>x</p>');
  });

  it('strips a javascript: href', () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
  });

  // Inline body images are inserted by the editor's "Shto foto" button, so an <img> with
  // an http(s) src must SURVIVE the pass — while everything executable on it does not.
  it('keeps an uploaded inline image with src and alt', () => {
    const clean = sanitizeRichText(
      '<p>a</p><img src="http://localhost:4000/uploads/abc.png" alt="Foto"><p>b</p>',
    );

    expect(clean).toContain('<img src="http://localhost:4000/uploads/abc.png" alt="Foto" />');
  });

  it('strips an onerror handler from an image but keeps the image', () => {
    const clean = sanitizeRichText('<img src="https://cdn.test/a.png" alt="x" onerror="alert(1)">');

    expect(clean).not.toContain('onerror');
    expect(clean).not.toContain('alert');
    expect(clean).toContain('src="https://cdn.test/a.png"');
  });

  it('strips a javascript: image src', () => {
    expect(sanitizeRichText('<img src="javascript:alert(1)" alt="x">')).not.toContain('javascript:');
  });

  it('strips a data: image src', () => {
    expect(
      sanitizeRichText('<img src="data:image/svg+xml;base64,PHN2Zz4=" alt="x" />'),
    ).not.toContain('data:');
  });

  it('adds rel="noopener noreferrer" to outbound links', () => {
    const clean = sanitizeRichText('<a href="https://example.com">x</a>');

    expect(clean).toContain('rel="noopener noreferrer"');
  });

  it('strips a disallowed tag such as iframe', () => {
    expect(sanitizeRichText('<iframe src="https://evil.test"></iframe>')).toBe('');
  });

  it('builds a plain-text excerpt', () => {
    expect(toExcerpt('<p>Hello   <b>world</b></p>', 200)).toBe('Hello world');
  });

  it('ellipsises an over-long excerpt', () => {
    const excerpt = toExcerpt(`<p>${'a'.repeat(300)}</p>`, 50);

    expect(excerpt).toHaveLength(51);
    expect(excerpt.endsWith('…')).toBe(true);
  });
});

describe('prisma error helpers', () => {
  const known = (code: string, meta?: Record<string, unknown>) =>
    new Prisma.PrismaClientKnownRequestError('boom', {
      code,
      clientVersion: '5.22.0',
      ...(meta === undefined ? {} : { meta }),
    });

  it('detects a unique violation', () => {
    expect(isUniqueViolation(known('P2002'))).toBe(true);
    expect(isUniqueViolation(known('P2025'))).toBe(false);
    expect(isUniqueViolation(new Error('x'))).toBe(false);
  });

  it('detects a record-not-found', () => {
    expect(isRecordNotFound(known('P2025'))).toBe(true);
    expect(isRecordNotFound(known('P2002'))).toBe(false);
  });

  it('reads the violated targets in either shape', () => {
    expect(uniqueViolationTargets(known('P2002', { target: ['slug'] }))).toEqual(['slug']);
    expect(uniqueViolationTargets(known('P2002', { target: 'slug' }))).toEqual(['slug']);
    expect(uniqueViolationTargets(known('P2002'))).toEqual([]);
    expect(uniqueViolationTargets(known('P2002', { target: [1, 'slug'] }))).toEqual(['slug']);
  });
});

describe('asyncHandler', () => {
  it('forwards a rejected promise to next()', async () => {
    const boom = new Error('boom');
    const handler = asyncHandler(async () => {
      throw boom;
    });

    const forwarded = await new Promise((resolve) => {
      handler({} as never, {} as never, resolve as never);
    });

    expect(forwarded).toBe(boom);
  });

  it('does not call next on success', async () => {
    let called = false;
    const handler = asyncHandler(async () => undefined);

    handler({} as never, {} as never, (() => {
      called = true;
    }) as never);

    await new Promise((resolve) => setImmediate(resolve));
    expect(called).toBe(false);
  });
});
