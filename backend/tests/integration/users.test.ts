import { beforeEach, describe, expect, it } from 'vitest';
import { AuditAction, Role } from '@prisma/client';
import { prisma } from '../../src/lib/prisma';
import { ApiError } from '../../src/lib/api-error';
import * as usersService from '../../src/services/users.service';
import type { AuditContext } from '../../src/lib/audit';
import { api } from '../helpers/api';
import {
  TEST_PASSWORD,
  accessTokenIssuedSecondsAgo,
  auditRows,
  createActors,
  createUser,
  latestAudit,
  type Actors,
} from '../helpers/db';

let actors: Actors;

beforeEach(async () => {
  actors = await createActors();
});

const auditContext = (actorId: string, actorEmail: string): AuditContext => ({
  actorId,
  actorEmail,
  actorRole: Role.ADMIN,
  ip: '10.0.0.1',
  userAgent: 'vitest',
});

describe('GET /api/admin/users', () => {
  it('lists staff with a post count and no password hash', async () => {
    const response = await api.get('/api/admin/users', { token: actors.adminToken });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).not.toHaveProperty('passwordHash');
    expect(response.body.data[0]).toHaveProperty('postCount');
    expect(JSON.stringify(response.body)).not.toContain('$2a$');
  });

  it('filters by role and by isActive', async () => {
    await createUser({ email: 'off@cacttus.test', isActive: false });

    expect((await api.get('/api/admin/users?role=ADMIN', { token: actors.adminToken })).body.data)
      .toHaveLength(1);
    expect(
      (await api.get('/api/admin/users?isActive=false', { token: actors.adminToken })).body.data,
    ).toHaveLength(1);
  });

  it('searches name and email', async () => {
    const response = await api.get('/api/admin/users?search=EDITOR', {
      token: actors.adminToken,
    });

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].email).toBe('editor@cacttus.test');
  });

  it('sorts and paginates', async () => {
    const response = await api.get('/api/admin/users?sort=email&order=asc&pageSize=1', {
      token: actors.adminToken,
    });

    expect(response.body.data[0].email).toBe('admin@cacttus.test');
    expect(response.body.meta).toMatchObject({ total: 2, totalPages: 2 });
  });

  it('returns a single user with the post count and without the hash', async () => {
    await prisma.post.create({
      data: {
        slug: 'artikull',
        title: 'Artikull',
        content: '<p>x</p>',
        authorId: actors.editor.id,
      },
    });

    const response = await api.get(`/api/admin/users/${actors.editor.id}`, {
      token: actors.adminToken,
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: actors.editor.id,
      email: 'editor@cacttus.test',
      role: Role.EDITOR,
      isActive: true,
      postCount: 1,
    });
    expect(response.body.data).not.toHaveProperty('passwordHash');
  });

  it('404s an unknown id', async () => {
    const response = await api.get('/api/admin/users/missing', { token: actors.adminToken });

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('User not found.');
  });
});

describe('POST /api/admin/users', () => {
  it('creates an account and audits it without the password', async () => {
    const response = await api
      .post('/api/admin/users', { token: actors.adminToken })
      .send({
        email: '  NEW@Cacttus.TEST ',
        name: 'New Staff',
        password: 'SuperSecret-12345',
        role: Role.ADMIN,
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      email: 'new@cacttus.test',
      name: 'New Staff',
      role: Role.ADMIN,
      isActive: true,
      postCount: 0,
    });
    expect(response.body.data).not.toHaveProperty('passwordHash');

    const row = await latestAudit(AuditAction.USER_CREATED);
    expect(row?.metadata).toEqual({ targetEmail: 'new@cacttus.test', role: Role.ADMIN });
    expect(JSON.stringify(row)).not.toContain('SuperSecret-12345');
  });

  it('stores a bcrypt hash, never the plaintext', async () => {
    await api
      .post('/api/admin/users', { token: actors.adminToken })
      .send({ email: 'hashed@cacttus.test', name: 'H', password: 'SuperSecret-12345' });

    const created = await prisma.user.findUniqueOrThrow({
      where: { email: 'hashed@cacttus.test' },
    });

    expect(created.passwordHash).not.toContain('SuperSecret-12345');
    expect(created.passwordHash.startsWith('$2')).toBe(true);
  });

  it('defaults a missing role to EDITOR, never ADMIN', async () => {
    const response = await api
      .post('/api/admin/users', { token: actors.adminToken })
      .send({ email: 'default@cacttus.test', name: 'D', password: 'SuperSecret-12345' });

    expect(response.body.data.role).toBe(Role.EDITOR);
  });

  it('409s a duplicate email with a field-level detail', async () => {
    const response = await api
      .post('/api/admin/users', { token: actors.adminToken })
      .send({ email: actors.editor.email, name: 'Dup', password: 'SuperSecret-12345' });

    expect(response.status).toBe(409);
    expect(response.body.error.details).toEqual([
      { field: 'body.email', message: 'Email is already taken.' },
    ]);
    expect(await prisma.user.count()).toBe(2);
  });

  it('400s a password below the minimum length', async () => {
    const response = await api
      .post('/api/admin/users', { token: actors.adminToken })
      .send({ email: 'short@cacttus.test', name: 'S', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('body.password');
  });

  it('400s an invalid email', async () => {
    const response = await api
      .post('/api/admin/users', { token: actors.adminToken })
      .send({ email: 'nope', name: 'S', password: 'SuperSecret-12345' });

    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/admin/users/:id', () => {
  it('updates the name and audits it as USER_UPDATED', async () => {
    const response = await api
      .patch(`/api/admin/users/${actors.editor.id}`, { token: actors.adminToken })
      .send({ name: 'Renamed Editor' });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Renamed Editor');

    const row = await latestAudit(AuditAction.USER_UPDATED);
    expect(row?.metadata).toEqual({ targetEmail: actors.editor.email, nameChanged: true });
  });

  it('records a role change with the previous role', async () => {
    await api
      .patch(`/api/admin/users/${actors.editor.id}`, { token: actors.adminToken })
      .send({ role: Role.ADMIN });

    const row = await latestAudit(AuditAction.USER_UPDATED);
    expect(row?.metadata).toMatchObject({ fromRole: Role.EDITOR, role: Role.ADMIN });
  });

  it('uses its own USER_DEACTIVATED action rather than a generic update', async () => {
    const response = await api
      .patch(`/api/admin/users/${actors.editor.id}`, { token: actors.adminToken })
      .send({ isActive: false });

    expect(response.status).toBe(200);
    expect(response.body.data.isActive).toBe(false);

    expect(await auditRows(AuditAction.USER_DEACTIVATED)).toHaveLength(1);
    expect(await auditRows(AuditAction.USER_UPDATED)).toHaveLength(0);
  });

  it('records re-activation as USER_UPDATED', async () => {
    await prisma.user.update({ where: { id: actors.editor.id }, data: { isActive: false } });

    await api
      .patch(`/api/admin/users/${actors.editor.id}`, { token: actors.adminToken })
      .send({ isActive: true });

    expect(await auditRows(AuditAction.USER_UPDATED)).toHaveLength(1);
  });

  it('refuses an empty patch', async () => {
    const response = await api
      .patch(`/api/admin/users/${actors.editor.id}`, { token: actors.adminToken })
      .send({});

    expect(response.status).toBe(400);
  });

  it('does not accept an email change — the field is not updatable', async () => {
    const response = await api
      .patch(`/api/admin/users/${actors.editor.id}`, { token: actors.adminToken })
      .send({ email: 'changed@cacttus.test' });

    expect(response.status).toBe(400);

    const unchanged = await prisma.user.findUniqueOrThrow({ where: { id: actors.editor.id } });
    expect(unchanged.email).toBe('editor@cacttus.test');
  });

  it('404s an unknown id', async () => {
    const response = await api
      .patch('/api/admin/users/missing', { token: actors.adminToken })
      .send({ name: 'X' });

    expect(response.status).toBe(404);
  });
});

describe('lockout guardrails', () => {
  it('409s when an admin tries to demote their OWN account', async () => {
    const response = await api
      .patch(`/api/admin/users/${actors.admin.id}`, { token: actors.adminToken })
      .send({ role: Role.EDITOR });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toMatch(/cannot change the role of your own account/);

    const unchanged = await prisma.user.findUniqueOrThrow({ where: { id: actors.admin.id } });
    expect(unchanged.role).toBe(Role.ADMIN);
  });

  it('409s when an admin tries to deactivate their OWN account', async () => {
    const response = await api
      .patch(`/api/admin/users/${actors.admin.id}`, { token: actors.adminToken })
      .send({ isActive: false });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toMatch(/cannot deactivate your own account/);
  });

  it('409s when an admin tries to delete their OWN account', async () => {
    const response = await api.delete(`/api/admin/users/${actors.admin.id}`, {
      token: actors.adminToken,
    });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toMatch(/cannot delete your own account/);
    expect(await prisma.user.count()).toBe(2);
  });

  /**
   * The last-active-ADMIN guard itself is exercised at the SERVICE layer.
   *
   * Over HTTP it is unreachable: the actor must be an authenticated, active ADMIN, so
   * `assertNotLastActiveAdmin` can only see zero other active admins when the actor IS
   * the target — and `assertNotSelf` already rejects that case first. Both paths end in
   * a 409, so the system is safe either way; these tests pin the second guard directly.
   */
  it('refuses to demote the last active administrator', async () => {
    const soleAdmin = await prisma.user.findUniqueOrThrow({ where: { id: actors.admin.id } });
    const dormantAdmin = await createUser({
      email: 'dormant@cacttus.test',
      role: Role.ADMIN,
      isActive: false,
    });

    await expect(
      usersService.updateUser(
        dormantAdmin.id,
        soleAdmin.id,
        { role: Role.EDITOR },
        auditContext(dormantAdmin.id, dormantAdmin.email),
      ),
    ).rejects.toThrow(/Cannot demote the last active administrator/);

    const untouched = await prisma.user.findUniqueOrThrow({ where: { id: soleAdmin.id } });
    expect(untouched.role).toBe(Role.ADMIN);
  });

  it('refuses to deactivate the last active administrator', async () => {
    const dormantAdmin = await createUser({
      email: 'dormant@cacttus.test',
      role: Role.ADMIN,
      isActive: false,
    });

    await expect(
      usersService.updateUser(
        dormantAdmin.id,
        actors.admin.id,
        { isActive: false },
        auditContext(dormantAdmin.id, dormantAdmin.email),
      ),
    ).rejects.toThrow(/Cannot deactivate the last active administrator/);
  });

  it('refuses to delete the last active administrator', async () => {
    const dormantAdmin = await createUser({
      email: 'dormant@cacttus.test',
      role: Role.ADMIN,
      isActive: false,
    });

    await expect(
      usersService.deleteUser(
        dormantAdmin.id,
        actors.admin.id,
        auditContext(dormantAdmin.id, dormantAdmin.email),
      ),
    ).rejects.toThrow(/Cannot delete the last active administrator/);

    expect(await prisma.user.findUnique({ where: { id: actors.admin.id } })).not.toBeNull();
  });

  it('raises the guard as a 409 CONFLICT, not a 500', async () => {
    const dormantAdmin = await createUser({
      email: 'dormant@cacttus.test',
      role: Role.ADMIN,
      isActive: false,
    });

    try {
      await usersService.deleteUser(
        dormantAdmin.id,
        actors.admin.id,
        auditContext(dormantAdmin.id, dormantAdmin.email),
      );
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(409);
      expect((error as ApiError).code).toBe('CONFLICT');
    }
  });

  it('allows demoting an admin while another active admin remains', async () => {
    const second = await createUser({ email: 'second@cacttus.test', role: Role.ADMIN });

    const response = await api
      .patch(`/api/admin/users/${second.id}`, { token: actors.adminToken })
      .send({ role: Role.EDITOR });

    expect(response.status).toBe(200);
    expect(response.body.data.role).toBe(Role.EDITOR);
  });
});

describe('DELETE /api/admin/users/:id', () => {
  it('deletes an account that has authored nothing and audits it', async () => {
    const response = await api.delete(`/api/admin/users/${actors.editor.id}`, {
      token: actors.adminToken,
    });

    expect(response.status).toBe(204);
    expect(await prisma.user.findUnique({ where: { id: actors.editor.id } })).toBeNull();

    const row = await latestAudit(AuditAction.USER_DELETED);
    expect(row).toMatchObject({ actorId: actors.admin.id, entityId: actors.editor.id });
    expect(row?.metadata).toEqual({
      targetEmail: 'editor@cacttus.test',
      targetRole: Role.EDITOR,
    });
  });

  it('409s with an actionable message when the user has authored posts', async () => {
    await prisma.post.create({
      data: {
        slug: 'artikull',
        title: 'Artikull',
        content: '<p>x</p>',
        authorId: actors.editor.id,
      },
    });

    const response = await api.delete(`/api/admin/users/${actors.editor.id}`, {
      token: actors.adminToken,
    });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toMatch(/authored 1 post\(s\)/);
    expect(response.body.error.message).toMatch(/Deactivate the account instead/);
    expect(await prisma.user.findUnique({ where: { id: actors.editor.id } })).not.toBeNull();
  });

  it('404s an unknown id', async () => {
    const response = await api.delete('/api/admin/users/missing', {
      token: actors.adminToken,
    });

    expect(response.status).toBe(404);
  });
});

describe('POST /api/admin/users/:id/reset-password', () => {
  it('resets the password, evicts every session and audits it without the password', async () => {
    const before = actors.editor.passwordChangedAt;

    const response = await api
      .post(`/api/admin/users/${actors.editor.id}/reset-password`, {
        token: actors.adminToken,
      })
      .send({ newPassword: 'AdminChosen-98765' });

    expect(response.status).toBe(204);

    const after = await prisma.user.findUniqueOrThrow({ where: { id: actors.editor.id } });
    expect(after.passwordChangedAt.getTime()).toBeGreaterThan(before.getTime());

    const row = await latestAudit(AuditAction.PASSWORD_RESET);
    expect(row?.metadata).toEqual({
      targetEmail: 'editor@cacttus.test',
      sessionsRevoked: true,
    });
    expect(JSON.stringify(row)).not.toContain('AdminChosen-98765');

    // The new password works and the old one does not.
    const withNew = await api
      .post('/api/auth/login')
      .send({ email: actors.editor.email, password: 'AdminChosen-98765' });
    const withOld = await api
      .post('/api/auth/login')
      .send({ email: actors.editor.email, password: TEST_PASSWORD });

    expect(withNew.status).toBe(200);
    expect(withOld.status).toBe(401);
  });

  it('invalidates an access token issued before the reset', async () => {
    // Explicitly backdated: `isTokenStale` compares whole seconds, so a token minted in
    // the same second as the reset is legitimately still valid.
    const staleToken = accessTokenIssuedSecondsAgo(actors.editor, 60);

    expect((await api.get('/api/auth/me', { token: staleToken })).status).toBe(200);

    await api
      .post(`/api/admin/users/${actors.editor.id}/reset-password`, {
        token: actors.adminToken,
      })
      .send({ newPassword: 'AdminChosen-98765' });

    const response = await api.get('/api/auth/me', { token: staleToken });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toMatch(/password changed/);
  });

  it('400s a password below the minimum length', async () => {
    const response = await api
      .post(`/api/admin/users/${actors.editor.id}/reset-password`, {
        token: actors.adminToken,
      })
      .send({ newPassword: 'short' });

    expect(response.status).toBe(400);
  });

  it('404s an unknown id', async () => {
    const response = await api
      .post('/api/admin/users/missing/reset-password', { token: actors.adminToken })
      .send({ newPassword: 'AdminChosen-98765' });

    expect(response.status).toBe(404);
  });
});
