/**
 * Cross-cutting HTTP behaviour: the error envelope, the 404 handler, security headers,
 * CORS, the correlation id and the credential throttle.
 */
import { describe, expect, it } from 'vitest';
import { env } from '../../src/config/env';
import { JSON_BODY_LIMIT } from '../../src/config/constants';
import { api } from '../helpers/api';
import { TEST_PASSWORD, WRONG_PASSWORD, createActors, createUser } from '../helpers/db';

describe('not-found handler', () => {
  it('answers an unmatched path with the JSON envelope, not Express HTML', async () => {
    const response = await api.get('/api/does/not/exist');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'No route matches GET /api/does/not/exist.',
        details: [],
      },
    });
  });

  it('answers an unmatched method on a real path', async () => {
    const response = await api.put('/api/auth/login').send({});

    expect(response.status).toBe(404);
    expect(response.body.error.message).toContain('PUT /api/auth/login');
  });

  it('answers an unmatched root path', async () => {
    expect((await api.get('/')).status).toBe(404);
  });
});

describe('error handler', () => {
  it('turns malformed JSON into a 400, not a 500', async () => {
    const response = await api
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "a@b.com", ');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Request body is not valid JSON.');
  });

  it('turns an oversized body into a 413', async () => {
    const oversized = 'x'.repeat(2 * 1024 * 1024);

    const response = await api
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@b.com', password: oversized }));

    expect(response.status).toBe(413);
    expect(response.body.error.message).toBe('Request body is too large.');
    expect(JSON_BODY_LIMIT).toBe('1mb');
  });

  it('never leaks a stack trace or a connection string to the client', async () => {
    const response = await api.get('/api/does/not/exist');
    const serialised = JSON.stringify(response.body);

    expect(serialised).not.toContain('postgresql://');
    expect(serialised).not.toContain('at Object.');
  });
});

describe('security headers', () => {
  it('sets the helmet policy and hides the framework', async () => {
    const response = await api.get('/health');

    expect(response.headers['content-security-policy']).toContain("default-src 'none'");
    expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('stamps a correlation id on every response', async () => {
    const response = await api.get('/health');

    expect(response.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('marks the health probes uncacheable', async () => {
    expect((await api.get('/health')).headers['cache-control']).toBe('no-store');
    expect((await api.get('/health/ready')).headers['cache-control']).toBe('no-store');
  });
});

describe('CORS', () => {
  it('allows the dashboard origin with credentials', async () => {
    const response = await api.get('/health', { origin: env.DASHBOARD_ORIGIN });

    expect(response.headers['access-control-allow-origin']).toBe(env.DASHBOARD_ORIGIN);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('allows the marketing origin', async () => {
    const response = await api.get('/api/public/posts', { origin: env.MARKETING_ORIGIN });

    expect(response.headers['access-control-allow-origin']).toBe(env.MARKETING_ORIGIN);
  });

  it('tolerates a trailing slash on the origin', async () => {
    const response = await api.get('/health', { origin: `${env.DASHBOARD_ORIGIN}/` });

    expect(response.headers['access-control-allow-origin']).toBe(`${env.DASHBOARD_ORIGIN}/`);
  });

  it('does NOT echo an unknown origin', async () => {
    const response = await api.get('/health', { origin: 'https://evil.test' });

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('answers a preflight with 204 and the export headers exposed', async () => {
    const response = await api
      .options('/api/admin/submissions/export', { origin: env.DASHBOARD_ORIGIN })
      .set('Access-Control-Request-Method', 'GET');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-expose-headers']).toContain('Content-Disposition');
    expect(response.headers['access-control-expose-headers']).toContain('X-Export-Truncated');
    expect(response.headers['access-control-max-age']).toBe('600');
  });

  it('serves a request with no Origin at all (server-to-server, health probe)', async () => {
    expect((await api.get('/health')).status).toBe(200);
  });
});

describe('credential throttle', () => {
  it('locks out repeated FAILED logins from one IP', async () => {
    await createUser({ email: 'target@cacttus.test' });

    const ip = '198.51.100.10';
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 7; attempt += 1) {
      const response = await api
        .post('/api/auth/login', { ip })
        .send({ email: 'target@cacttus.test', password: WRONG_PASSWORD });
      statuses.push(response.status);
    }

    // LOGIN_RATE_LIMIT_MAX is 5 in .env.test.
    expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(statuses.slice(5)).toEqual([429, 429]);
    expect(statuses.filter((status) => status === 429).length).toBe(2);
  });

  it('does not count SUCCESSFUL logins against the budget', async () => {
    await createUser({ email: 'good@cacttus.test' });

    const ip = '198.51.100.11';
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await api
        .post('/api/auth/login', { ip })
        .send({ email: 'good@cacttus.test', password: TEST_PASSWORD });
      statuses.push(response.status);
    }

    expect(new Set(statuses)).toEqual(new Set([200]));
  });

  it('keys the budget per client IP', async () => {
    await createUser({ email: 'target2@cacttus.test' });

    for (let attempt = 0; attempt < 6; attempt += 1) {
      await api
        .post('/api/auth/login', { ip: '198.51.100.12' })
        .send({ email: 'target2@cacttus.test', password: WRONG_PASSWORD });
    }

    const otherIp = await api
      .post('/api/auth/login', { ip: '198.51.100.13' })
      .send({ email: 'target2@cacttus.test', password: WRONG_PASSWORD });

    expect(otherIp.status).toBe(401);
  });

  it('exposes draft-7 rate-limit headers', async () => {
    const response = await api.get('/api/public/posts');

    expect(response.headers['ratelimit-policy']).toBeDefined();
    expect(response.headers['x-ratelimit-limit']).toBeUndefined();
  });
});

describe('validation middleware', () => {
  it('reports the failing request part in the field path', async () => {
    const { adminToken } = await createActors();

    const response = await api.get('/api/admin/forms?page=0', { token: adminToken });

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('query.page');
  });

  it('reports params and body failures together', async () => {
    const { adminToken } = await createActors();

    const response = await api
      .patch(`/api/admin/forms/${'x'.repeat(100)}`, { token: adminToken })
      .send({});

    expect(response.status).toBe(400);
    const fields = response.body.error.details.map((detail: { field: string }) => detail.field);
    expect(fields).toContain('params.id');
    expect(fields.some((field: string) => field.startsWith('body'))).toBe(true);
  });

  it('coerces numeric query parameters from strings', async () => {
    const { adminToken } = await createActors();

    const response = await api.get('/api/admin/forms?page=2&pageSize=5', {
      token: adminToken,
    });

    expect(response.status).toBe(200);
    expect(response.body.meta).toMatchObject({ page: 2, pageSize: 5 });
  });
});
