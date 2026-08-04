import { beforeEach, describe, expect, it } from 'vitest';
import { AuditAction, Role } from '@prisma/client';
import { prisma } from '../../src/lib/prisma';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH } from '../../src/config/constants';
import { api, rawRefreshCookie, refreshCookieFrom } from '../helpers/api';
import {
  TEST_PASSWORD,
  WRONG_PASSWORD,
  accessTokenFor,
  auditRows,
  createUser,
  latestAudit,
} from '../helpers/db';
import { capturedLogText, clearCapturedLogs } from '../helpers/logs';

const ADMIN_EMAIL = 'admin@cacttus.test';

async function seedAdmin() {
  return createUser({ email: ADMIN_EMAIL, name: 'Test Admin', role: Role.ADMIN });
}

async function login(email: string, password: string) {
  return api.post('/api/auth/login').send({ email, password });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    clearCapturedLogs();
  });

  it('returns the user and an access token, and sets the refresh cookie', async () => {
    const admin = await seedAdmin();

    const response = await login(ADMIN_EMAIL, TEST_PASSWORD);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toMatchObject({
      id: admin.id,
      email: ADMIN_EMAIL,
      name: 'Test Admin',
      role: Role.ADMIN,
    });
    expect(typeof response.body.data.accessToken).toBe('string');
    expect(response.body.data.user).not.toHaveProperty('passwordHash');

    const cookie = rawRefreshCookie(response.headers);
    expect(cookie).toContain(`${REFRESH_COOKIE_NAME}=`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain(`Path=${REFRESH_COOKIE_PATH}`);
    expect(cookie).toContain('SameSite=Strict');
  });

  it('writes a LOGIN_SUCCESS audit row carrying the actor and the origin', async () => {
    const admin = await seedAdmin();

    await api
      .post('/api/auth/login', { ip: '203.0.113.9' })
      .set('User-Agent', 'vitest-agent')
      .send({ email: ADMIN_EMAIL, password: TEST_PASSWORD });

    const row = await latestAudit(AuditAction.LOGIN_SUCCESS);

    expect(row).toMatchObject({
      actorId: admin.id,
      actorEmail: ADMIN_EMAIL,
      actorRole: Role.ADMIN,
      entityType: 'Auth',
      entityId: null,
      ip: '203.0.113.9',
      userAgent: 'vitest-agent',
    });
    expect(row?.metadata).toEqual({ role: Role.ADMIN });
  });

  it('lowercases and trims the submitted email', async () => {
    await seedAdmin();

    const response = await login('  ADMIN@Cacttus.TEST  ', TEST_PASSWORD);

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(ADMIN_EMAIL);
  });

  it('rejects a wrong password with 401 and no token', async () => {
    await seedAdmin();

    const response = await login(ADMIN_EMAIL, WRONG_PASSWORD);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password.',
        details: [],
      },
    });
    expect(rawRefreshCookie(response.headers)).toBeNull();
  });

  it('records LOGIN_FAILED with the attempted email and NEVER the password', async () => {
    await seedAdmin();

    await login(ADMIN_EMAIL, WRONG_PASSWORD);

    const rows = await auditRows(AuditAction.LOGIN_FAILED);
    expect(rows).toHaveLength(1);

    const row = rows[0]!;
    expect(row.actorEmail).toBe(ADMIN_EMAIL);
    expect(row.actorId).toBeNull();
    expect(row.actorRole).toBe(Role.EDITOR);
    expect(row.entityType).toBe('Auth');
    expect(row.entityId).toBeNull();
    expect(row.metadata).toEqual({ outcome: 'rejected' });

    // The submitted password must appear NOWHERE in the persisted row.
    const serialised = JSON.stringify(row);
    expect(serialised).not.toContain(WRONG_PASSWORD);
    expect(serialised.toLowerCase()).not.toContain('password');
  });

  it('never writes the submitted password to the logs either', async () => {
    await seedAdmin();
    clearCapturedLogs();

    await login(ADMIN_EMAIL, WRONG_PASSWORD);

    expect(capturedLogText()).not.toContain(WRONG_PASSWORD);
  });

  it('gives an unknown email the identical error and still audits the attempt', async () => {
    await seedAdmin();

    const response = await login('ghost@cacttus.test', TEST_PASSWORD);

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Invalid email or password.');

    const row = await latestAudit(AuditAction.LOGIN_FAILED);
    expect(row?.actorEmail).toBe('ghost@cacttus.test');
    expect(row?.actorId).toBeNull();
  });

  it('refuses a deactivated account after the hash comparison', async () => {
    await createUser({ email: 'off@cacttus.test', isActive: false });

    const response = await login('off@cacttus.test', TEST_PASSWORD);

    expect(response.status).toBe(401);
    expect(response.body.error.message).toMatch(/deactivated/);
    expect(await latestAudit(AuditAction.LOGIN_FAILED)).not.toBeNull();
  });

  it('rejects a malformed body with 400 and field-level details', async () => {
    const response = await api.post('/api/auth/login').send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_FAILED');
    expect(response.body.error.details.map((detail: { field: string }) => detail.field)).toEqual(
      expect.arrayContaining(['body.email', 'body.password']),
    );
    expect(await prisma.auditLog.count()).toBe(0);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the profile for a valid bearer token', async () => {
    const admin = await seedAdmin();

    const response = await api.get('/api/auth/me', { token: accessTokenFor(admin) });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({ id: admin.id, email: ADMIN_EMAIL });
    expect(response.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('sets Cache-Control: no-store on admin-facing reads', async () => {
    const admin = await seedAdmin();

    const response = await api.get('/api/admin/forms', { token: accessTokenFor(admin) });

    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('rejects a missing Authorization header', async () => {
    const response = await api.get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Missing bearer token.');
  });

  it('rejects a garbage token', async () => {
    const response = await api.get('/api/auth/me', { token: 'not-a-jwt' });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Token is invalid.');
  });

  it('rejects a token whose account was deleted — the per-request re-read', async () => {
    const admin = await seedAdmin();
    const token = accessTokenFor(admin);
    await prisma.user.delete({ where: { id: admin.id } });

    const response = await api.get('/api/auth/me', { token });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Account no longer exists.');
  });

  it('rejects a token whose account was deactivated mid-session', async () => {
    const admin = await seedAdmin();
    const token = accessTokenFor(admin);
    await prisma.user.update({ where: { id: admin.id }, data: { isActive: false } });

    const response = await api.get('/api/auth/me', { token });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('This account has been deactivated.');
  });

  it('evicts a session issued before the last password change', async () => {
    const admin = await seedAdmin();
    const token = accessTokenFor(admin);

    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordChangedAt: new Date(Date.now() + 10_000) },
    });

    const response = await api.get('/api/auth/me', { token });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toMatch(/password changed/);
  });
});

describe('POST /api/auth/refresh', () => {
  it('rotates the cookie and issues a fresh access token', async () => {
    await seedAdmin();
    const loggedIn = await login(ADMIN_EMAIL, TEST_PASSWORD);
    const cookie = refreshCookieFrom(loggedIn.headers) as string;

    const response = await api.post('/api/auth/refresh', { cookie }).send();

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(ADMIN_EMAIL);
    expect(typeof response.body.data.accessToken).toBe('string');
    expect(rawRefreshCookie(response.headers)).toContain(`${REFRESH_COOKIE_NAME}=`);
  });

  it('the rotated access token authenticates the next request', async () => {
    await seedAdmin();
    const loggedIn = await login(ADMIN_EMAIL, TEST_PASSWORD);
    const cookie = refreshCookieFrom(loggedIn.headers) as string;

    const refreshed = await api.post('/api/auth/refresh', { cookie }).send();
    const me = await api.get('/api/auth/me', { token: refreshed.body.data.accessToken });

    expect(me.status).toBe(200);
  });

  it('rejects a request with no refresh cookie', async () => {
    const response = await api.post('/api/auth/refresh').send();

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('No refresh session found.');
  });

  it('clears the cookie when it is forged or expired', async () => {
    const response = await api
      .post('/api/auth/refresh', { cookie: `${REFRESH_COOKIE_NAME}=forged.token.value` })
      .send();

    expect(response.status).toBe(401);
    expect(rawRefreshCookie(response.headers)).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it('refuses to refresh a deactivated account', async () => {
    const admin = await seedAdmin();
    const loggedIn = await login(ADMIN_EMAIL, TEST_PASSWORD);
    const cookie = refreshCookieFrom(loggedIn.headers) as string;

    await prisma.user.update({ where: { id: admin.id }, data: { isActive: false } });

    const response = await api.post('/api/auth/refresh', { cookie }).send();

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Session is no longer valid.');
  });

  it('refuses a refresh cookie older than the last password change', async () => {
    const admin = await seedAdmin();
    const loggedIn = await login(ADMIN_EMAIL, TEST_PASSWORD);
    const cookie = refreshCookieFrom(loggedIn.headers) as string;

    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordChangedAt: new Date(Date.now() + 10_000) },
    });

    const response = await api.post('/api/auth/refresh', { cookie }).send();

    expect(response.status).toBe(401);
    expect(response.body.error.message).toMatch(/password changed/);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the cookie and audits the session end', async () => {
    const admin = await seedAdmin();
    const loggedIn = await login(ADMIN_EMAIL, TEST_PASSWORD);
    const cookie = refreshCookieFrom(loggedIn.headers) as string;

    const response = await api.post('/api/auth/logout', { cookie }).send();

    expect(response.status).toBe(204);
    expect(rawRefreshCookie(response.headers)).toMatch(/Expires=Thu, 01 Jan 1970/);

    const row = await latestAudit(AuditAction.LOGOUT);
    expect(row).toMatchObject({
      actorId: admin.id,
      actorEmail: ADMIN_EMAIL,
      entityType: 'Auth',
    });
  });

  it('succeeds without a cookie but records nothing unattributable', async () => {
    const response = await api.post('/api/auth/logout').send();

    expect(response.status).toBe(204);
    expect(await auditRows(AuditAction.LOGOUT)).toHaveLength(0);
  });

  it('does not audit a forged cookie', async () => {
    const response = await api
      .post('/api/auth/logout', { cookie: `${REFRESH_COOKIE_NAME}=forged.value.here` })
      .send();

    expect(response.status).toBe(204);
    expect(await auditRows(AuditAction.LOGOUT)).toHaveLength(0);
  });

  it('attributes the logout from the bearer token when one is present', async () => {
    const admin = await seedAdmin();

    const response = await api.post('/api/auth/logout', { token: accessTokenFor(admin) }).send();

    expect(response.status).toBe(204);
    // /logout carries no requireAuth, so req.auth is absent and an unusable cookie
    // means there is nothing to attribute: no row is written.
    expect(await auditRows(AuditAction.LOGOUT)).toHaveLength(0);
  });
});

describe('POST /api/auth/change-password', () => {
  const NEW_PASSWORD = 'BrandNewSecret-2026';

  it('changes the password, audits it and clears the cookie', async () => {
    const admin = await seedAdmin();

    const response = await api
      .post('/api/auth/change-password', { token: accessTokenFor(admin) })
      .send({ currentPassword: TEST_PASSWORD, newPassword: NEW_PASSWORD });

    expect(response.status).toBe(204);
    expect(rawRefreshCookie(response.headers)).toMatch(/Expires=Thu, 01 Jan 1970/);

    const row = await latestAudit(AuditAction.PASSWORD_CHANGED);
    expect(row?.metadata).toEqual({ selfService: true, sessionsRevoked: true });
    expect(JSON.stringify(row)).not.toContain(NEW_PASSWORD);
    expect(JSON.stringify(row)).not.toContain(TEST_PASSWORD);

    expect((await login(ADMIN_EMAIL, NEW_PASSWORD)).status).toBe(200);
    expect((await login(ADMIN_EMAIL, TEST_PASSWORD)).status).toBe(401);
  });

  it('bumps passwordChangedAt so every existing session dies', async () => {
    const admin = await seedAdmin();
    const before = admin.passwordChangedAt;

    await api
      .post('/api/auth/change-password', { token: accessTokenFor(admin) })
      .send({ currentPassword: TEST_PASSWORD, newPassword: NEW_PASSWORD });

    const after = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
    expect(after.passwordChangedAt.getTime()).toBeGreaterThan(before.getTime());
  });

  it('rejects a wrong current password with a field-level 400', async () => {
    const admin = await seedAdmin();

    const response = await api
      .post('/api/auth/change-password', { token: accessTokenFor(admin) })
      .send({ currentPassword: WRONG_PASSWORD, newPassword: NEW_PASSWORD });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([
      { field: 'body.currentPassword', message: 'Incorrect password.' },
    ]);
    expect(await auditRows(AuditAction.PASSWORD_CHANGED)).toHaveLength(0);
  });

  it('rejects a new password identical to the current one', async () => {
    const admin = await seedAdmin();

    const response = await api
      .post('/api/auth/change-password', { token: accessTokenFor(admin) })
      .send({ currentPassword: TEST_PASSWORD, newPassword: TEST_PASSWORD });

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('body.newPassword');
  });

  it('rejects a new password below the minimum length', async () => {
    const admin = await seedAdmin();

    const response = await api
      .post('/api/auth/change-password', { token: accessTokenFor(admin) })
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'short' });

    expect(response.status).toBe(400);
  });

  it('requires authentication', async () => {
    const response = await api
      .post('/api/auth/change-password')
      .send({ currentPassword: TEST_PASSWORD, newPassword: NEW_PASSWORD });

    expect(response.status).toBe(401);
  });
});
