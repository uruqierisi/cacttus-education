/**
 * The RBAC matrix.
 *
 * Every ADMIN-only endpoint is asserted twice: an EDITOR is refused, an ADMIN is
 * served. The refusal is additionally proved to come from the ROUTE MIDDLEWARE rather
 * than from the handler — see `assertMiddlewareForbidden` below.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { Response } from 'supertest';
import { Role } from '@prisma/client';
import { prisma } from '../../src/lib/prisma';
import { api } from '../helpers/api';
import { createActors, createForm, createSubmission, type Actors } from '../helpers/db';

/** The exact message `requireRole` produces. A handler never emits this string. */
const MIDDLEWARE_FORBIDDEN = 'This action requires a different role.';

// Includes `school_name` because the fixture form declares it as required.
const CSV = [
  'Emri,Email,Telefoni,school_name',
  'Arta,arta@example.com,+38344111222,Gjimnazi',
].join('\r\n');

function assertMiddlewareForbidden(response: Response): void {
  expect(response.status).toBe(403);
  expect(response.body).toEqual({
    success: false,
    error: { code: 'FORBIDDEN', message: MIDDLEWARE_FORBIDDEN, details: [] },
  });
}

describe('RBAC — EDITOR is refused, ADMIN is served', () => {
  let actors: Actors;
  let formId: string;

  beforeEach(async () => {
    actors = await createActors();
    const form = await createForm({ slug: 'aplikimi', title: 'Aplikimi' });
    formId = form.id;
  });

  it('form delete: EDITOR 403 / ADMIN 200', async () => {
    const refused = await api.delete(`/api/admin/forms/${formId}`, {
      token: actors.editorToken,
    });
    assertMiddlewareForbidden(refused);

    // The guard ran before the handler: the row is untouched.
    const untouched = await prisma.form.findUniqueOrThrow({ where: { id: formId } });
    expect(untouched.deletedAt).toBeNull();
    expect(await prisma.auditLog.count()).toBe(0);

    const allowed = await api.delete(`/api/admin/forms/${formId}`, {
      token: actors.adminToken,
    });
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.isDeleted).toBe(true);
  });

  it('archived form list: EDITOR 403 / ADMIN 200', async () => {
    assertMiddlewareForbidden(
      await api.get('/api/admin/forms/archived', { token: actors.editorToken }),
    );

    const allowed = await api.get('/api/admin/forms/archived', { token: actors.adminToken });
    expect(allowed.status).toBe(200);
    expect(allowed.body.data).toEqual([]);
  });

  it('form restore: EDITOR 403 / ADMIN 200', async () => {
    await prisma.form.update({
      where: { id: formId },
      data: { deletedAt: new Date(), isActive: false },
    });

    assertMiddlewareForbidden(
      await api.post(`/api/admin/forms/${formId}/restore`, { token: actors.editorToken }).send(),
    );

    const allowed = await api
      .post(`/api/admin/forms/${formId}/restore`, { token: actors.adminToken })
      .send();
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.isDeleted).toBe(false);
  });

  it('user management: EDITOR 403 on every verb / ADMIN served', async () => {
    const editorToken = actors.editorToken;

    assertMiddlewareForbidden(await api.get('/api/admin/users', { token: editorToken }));
    assertMiddlewareForbidden(
      await api.get(`/api/admin/users/${actors.admin.id}`, { token: editorToken }),
    );
    assertMiddlewareForbidden(
      await api
        .post('/api/admin/users', { token: editorToken })
        .send({ email: 'new@cacttus.test', name: 'New', password: 'LongEnough-123' }),
    );
    assertMiddlewareForbidden(
      await api
        .patch(`/api/admin/users/${actors.admin.id}`, { token: editorToken })
        .send({ name: 'Renamed' }),
    );
    assertMiddlewareForbidden(
      await api
        .post(`/api/admin/users/${actors.editor.id}/reset-password`, { token: editorToken })
        .send({ newPassword: 'LongEnough-123' }),
    );
    assertMiddlewareForbidden(
      await api.delete(`/api/admin/users/${actors.editor.id}`, { token: editorToken }),
    );

    // Nothing changed.
    expect(await prisma.user.count()).toBe(2);
    expect(await prisma.auditLog.count()).toBe(0);

    const allowed = await api.get('/api/admin/users', { token: actors.adminToken });
    expect(allowed.status).toBe(200);
    expect(allowed.body.data).toHaveLength(2);
  });

  it('audit logs: EDITOR 403 / ADMIN 200', async () => {
    assertMiddlewareForbidden(
      await api.get('/api/admin/audit-logs', { token: actors.editorToken }),
    );
    assertMiddlewareForbidden(
      await api.get('/api/admin/audit-logs/actions', { token: actors.editorToken }),
    );

    const allowed = await api.get('/api/admin/audit-logs', { token: actors.adminToken });
    expect(allowed.status).toBe(200);
    expect(Array.isArray(allowed.body.data)).toBe(true);
  });

  it('CSV import: EDITOR 403 / ADMIN 200', async () => {
    const refused = await api
      .post('/api/admin/submissions/import', { token: actors.editorToken })
      .field('formId', formId)
      .attach('file', Buffer.from(CSV, 'utf8'), {
        filename: 'leads.csv',
        contentType: 'text/csv',
      });
    assertMiddlewareForbidden(refused);
    expect(await prisma.submission.count()).toBe(0);

    const allowed = await api
      .post('/api/admin/submissions/import', { token: actors.adminToken })
      .field('formId', formId)
      .attach('file', Buffer.from(CSV, 'utf8'), {
        filename: 'leads.csv',
        contentType: 'text/csv',
      });
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.inserted).toBe(1);
  });

  it('per-form CSV export: EDITOR 403 / ADMIN 200', async () => {
    await createSubmission({ formId });

    assertMiddlewareForbidden(
      await api.get(`/api/admin/forms/${formId}/submissions/export`, {
        token: actors.editorToken,
      }),
    );

    const allowed = await api.get(`/api/admin/forms/${formId}/submissions/export`, {
      token: actors.adminToken,
    });
    expect(allowed.status).toBe(200);
    expect(allowed.headers['content-type']).toContain('text/csv');
  });

  it('post delete: EDITOR 403 / ADMIN 204', async () => {
    const post = await prisma.post.create({
      data: {
        slug: 'lajm',
        title: 'Lajm',
        content: '<p>x</p>',
        authorId: actors.editor.id,
      },
    });

    assertMiddlewareForbidden(
      await api.delete(`/api/admin/posts/${post.id}`, { token: actors.editorToken }),
    );
    expect(await prisma.post.count()).toBe(1);

    const allowed = await api.delete(`/api/admin/posts/${post.id}`, {
      token: actors.adminToken,
    });
    expect(allowed.status).toBe(204);
  });
});

describe('RBAC — the 403 is produced by middleware, before validation and before the handler', () => {
  let actors: Actors;

  beforeEach(async () => {
    actors = await createActors();
  });

  it('returns 403 (not 404) for a form id that does not exist', async () => {
    const response = await api.delete('/api/admin/forms/does-not-exist', {
      token: actors.editorToken,
    });

    assertMiddlewareForbidden(response);
  });

  it('returns 403 (not 404) for a user id that does not exist', async () => {
    const response = await api.get('/api/admin/users/does-not-exist', {
      token: actors.editorToken,
    });

    assertMiddlewareForbidden(response);
  });

  it('returns 403 (not 400) for a CSV import with no file and no formId', async () => {
    const response = await api
      .post('/api/admin/submissions/import', { token: actors.editorToken })
      .send();

    // requireAdmin sits ahead of uploadCsvFile and validate(), so an EDITOR never
    // reaches the body validation that would otherwise answer 400.
    assertMiddlewareForbidden(response);
  });

  it('returns 403 (not 400) for user creation with an invalid body', async () => {
    const response = await api
      .post('/api/admin/users', { token: actors.editorToken })
      .send({ email: 'nope', password: 'x' });

    assertMiddlewareForbidden(response);
  });

  it('returns 403 (not 400) for an audit-log query with invalid parameters', async () => {
    const response = await api.get('/api/admin/audit-logs?pageSize=99999', {
      token: actors.editorToken,
    });

    assertMiddlewareForbidden(response);
  });
});

describe('RBAC — the shared surface both roles may use', () => {
  let actors: Actors;

  beforeEach(async () => {
    actors = await createActors();
  });

  it.each<[string, Role]>([
    ['/api/admin/forms', Role.EDITOR],
    ['/api/admin/submissions', Role.EDITOR],
    ['/api/admin/submissions/stats', Role.EDITOR],
    ['/api/admin/posts', Role.EDITOR],
    ['/api/admin/posts/stats', Role.EDITOR],
    ['/api/admin/forms/field-types', Role.EDITOR],
  ])('%s is readable by an EDITOR', async (path) => {
    const response = await api.get(path, { token: actors.editorToken });

    expect(response.status).toBe(200);
  });

  it('an EDITOR may create and update a form', async () => {
    const created = await api
      .post('/api/admin/forms', { token: actors.editorToken })
      .send({ title: 'Trajnim', type: 'TRAINING' });

    expect(created.status).toBe(201);

    const updated = await api
      .patch(`/api/admin/forms/${created.body.data.id}`, { token: actors.editorToken })
      .send({ title: 'Trajnim i ri' });

    expect(updated.status).toBe(200);
  });

  it('an EDITOR may export the global submission CSV', async () => {
    const form = await createForm();
    await createSubmission({ formId: form.id });

    const response = await api.get('/api/admin/submissions/export', {
      token: actors.editorToken,
    });

    expect(response.status).toBe(200);
  });

  it('every admin route rejects an unauthenticated caller with 401', async () => {
    for (const path of [
      '/api/admin/forms',
      '/api/admin/submissions',
      '/api/admin/posts',
      '/api/admin/users',
      '/api/admin/audit-logs',
    ]) {
      const response = await api.get(path);

      expect(response.status).toBe(401);
    }
  });
});
