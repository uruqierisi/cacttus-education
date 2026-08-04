import { beforeEach, describe, expect, it } from 'vitest';
import { AuditAction, FormType } from '@prisma/client';
import { prisma } from '../../src/lib/prisma';
import { api } from '../helpers/api';
import {
  SCHOOL_FIELDS,
  auditRows,
  createActors,
  createForm,
  createSubmission,
  latestAudit,
  type Actors,
} from '../helpers/db';

let actors: Actors;

beforeEach(async () => {
  actors = await createActors();
});

const create = (body: Record<string, unknown>) =>
  api.post('/api/admin/forms', { token: actors.adminToken }).send(body);

describe('POST /api/admin/forms — slug derivation', () => {
  it('derives an Albanian-safe slug from the title', async () => {
    const response = await create({ title: 'Aplikimi për Shkollë', type: FormType.SCHOOL });

    expect(response.status).toBe(201);
    expect(response.body.data.slug).toBe('aplikimi-per-shkolle');
  });

  it('handles ç as well as ë', async () => {
    const response = await create({ title: 'Çështje Kibernetike', type: FormType.CYBER });

    expect(response.body.data.slug).toBe('ceshtje-kibernetike');
  });

  it('appends -2 then -3 when the same title is used again', async () => {
    const first = await create({ title: 'Aplikimi për Shkollë', type: FormType.SCHOOL });
    const second = await create({ title: 'Aplikimi për Shkollë', type: FormType.SCHOOL });
    const third = await create({ title: 'Aplikimi për Shkollë', type: FormType.SCHOOL });

    expect([first, second, third].map((response) => response.body.data.slug)).toEqual([
      'aplikimi-per-shkolle',
      'aplikimi-per-shkolle-2',
      'aplikimi-per-shkolle-3',
    ]);
  });

  it('treats a soft-deleted form as still holding its slug', async () => {
    const first = await create({ title: 'Aplikimi', type: FormType.SCHOOL });
    await api.delete(`/api/admin/forms/${first.body.data.id}`, { token: actors.adminToken });

    const second = await create({ title: 'Aplikimi', type: FormType.SCHOOL });

    expect(second.body.data.slug).toBe('aplikimi-2');
  });

  it('honours an explicit slug', async () => {
    const response = await create({
      slug: 'nje-slug-i-zgjedhur',
      title: 'Diçka',
      type: FormType.ZHVAM,
    });

    expect(response.body.data.slug).toBe('nje-slug-i-zgjedhur');
  });

  it('rejects an explicit slug that is already taken with 409', async () => {
    await createForm({ slug: 'e-zene' });

    const response = await create({ slug: 'e-zene', title: 'X', type: FormType.ZHVAM });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
    expect(response.body.error.details).toEqual([
      { field: 'body.slug', message: 'must be unique' },
    ]);
  });

  it('rejects a slug that is not lowercase-dashed', async () => {
    const response = await create({ slug: 'Not A Slug', title: 'X', type: FormType.ZHVAM });

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('body.slug');
  });
});

describe('POST /api/admin/forms — payload and audit', () => {
  it('stores field definitions and returns them sorted', async () => {
    const response = await create({
      title: 'Me fusha',
      type: FormType.SCHOOL,
      fields: SCHOOL_FIELDS,
    });

    expect(response.status).toBe(201);
    expect(response.body.data.fields.map((field: { name: string }) => field.name)).toEqual([
      'school_name',
      'city',
      'interests',
      'consent',
    ]);
    expect(response.body.data.submissionCount).toBe(0);
    expect(response.body.data.isActive).toBe(true);
  });

  it('writes a FORM_CREATED audit row with counts, never the field definitions', async () => {
    const response = await create({
      title: 'Me fusha',
      type: FormType.SCHOOL,
      fields: SCHOOL_FIELDS,
    });

    const row = await latestAudit(AuditAction.FORM_CREATED);

    expect(row).toMatchObject({
      actorId: actors.admin.id,
      actorEmail: actors.admin.email,
      entityType: 'Form',
      entityId: response.body.data.id,
    });
    expect(row?.metadata).toEqual({
      slug: 'me-fusha',
      title: 'Me fusha',
      type: FormType.SCHOOL,
      isActive: true,
      fieldCount: 4,
    });
    expect(JSON.stringify(row?.metadata)).not.toContain('Emri i shkollës');
  });

  it('rejects an invalid field definition', async () => {
    const response = await create({
      title: 'X',
      type: FormType.SCHOOL,
      fields: [{ name: 'email', label: 'Email', type: 'email' }],
    });

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toMatch(/^body\.fields/);
  });

  it('rejects an unknown form type', async () => {
    const response = await create({ title: 'X', type: 'NOPE' });

    expect(response.status).toBe(400);
  });

  it('rejects a missing title', async () => {
    const response = await create({ type: FormType.SCHOOL });

    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/admin/forms/:id', () => {
  it('updates the requested attributes and audits which ones changed', async () => {
    const form = await createForm({ slug: 'para', title: 'Para' });

    const response = await api
      .patch(`/api/admin/forms/${form.id}`, { token: actors.editorToken })
      .send({ title: 'Pas', isActive: false });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ title: 'Pas', isActive: false, slug: 'para' });

    const row = await latestAudit(AuditAction.FORM_UPDATED);
    expect(row?.metadata).toMatchObject({ changed: 'title,isActive', title: 'Pas' });
    expect(row?.actorId).toBe(actors.editor.id);
  });

  it('rejects an empty patch body', async () => {
    const form = await createForm();

    const response = await api
      .patch(`/api/admin/forms/${form.id}`, { token: actors.adminToken })
      .send({});

    expect(response.status).toBe(400);
  });

  it('404s for an unknown id', async () => {
    const response = await api
      .patch('/api/admin/forms/missing', { token: actors.adminToken })
      .send({ title: 'X' });

    expect(response.status).toBe(404);
  });

  it('404s for a soft-deleted form', async () => {
    const form = await createForm({ deletedAt: new Date() });

    const response = await api
      .patch(`/api/admin/forms/${form.id}`, { token: actors.adminToken })
      .send({ title: 'X' });

    expect(response.status).toBe(404);
  });

  it('refuses to move onto a slug owned by another form', async () => {
    await createForm({ slug: 'taken' });
    const form = await createForm({ slug: 'mine' });

    const response = await api
      .patch(`/api/admin/forms/${form.id}`, { token: actors.adminToken })
      .send({ slug: 'taken' });

    expect(response.status).toBe(409);
  });

  it('allows a no-op re-assignment of a form to its own slug', async () => {
    const form = await createForm({ slug: 'mine' });

    const response = await api
      .patch(`/api/admin/forms/${form.id}`, { token: actors.adminToken })
      .send({ slug: 'mine' });

    expect(response.status).toBe(200);
  });
});

describe('DELETE /api/admin/forms/:id — soft delete', () => {
  it('hides the form from the public route while the submissions survive', async () => {
    const form = await createForm({ slug: 'aplikimi', fields: SCHOOL_FIELDS });
    await createSubmission({ formId: form.id, email: 'lead@example.com' });

    expect((await api.get('/api/public/forms/aplikimi')).status).toBe(200);

    const deleted = await api.delete(`/api/admin/forms/${form.id}`, {
      token: actors.adminToken,
    });
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.isDeleted).toBe(true);
    expect(deleted.body.data.isActive).toBe(false);

    // Public lookup and public submission are both gone.
    const publicGet = await api.get('/api/public/forms/aplikimi');
    expect(publicGet.status).toBe(404);
    expect(publicGet.body.error.message).toBe('This form is not available.');

    const publicPost = await api
      .post('/api/public/forms/aplikimi/submit')
      .send({ name: 'Arta', email: 'a@b.com', phone: '+38344111222', data: {} });
    expect(publicPost.status).toBe(404);

    // The row itself and its submissions are intact.
    const row = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });
    expect(row.deletedAt).not.toBeNull();
    expect(await prisma.submission.count({ where: { formId: form.id } })).toBe(1);
    expect(
      (await prisma.submission.findFirstOrThrow({ where: { formId: form.id } })).email,
    ).toBe('lead@example.com');
  });

  it('drops the form out of the default admin list but keeps it in the archive', async () => {
    const form = await createForm({ slug: 'aplikimi' });
    await api.delete(`/api/admin/forms/${form.id}`, { token: actors.adminToken });

    const list = await api.get('/api/admin/forms', { token: actors.adminToken });
    expect(list.body.data).toEqual([]);

    const archived = await api.get('/api/admin/forms/archived', { token: actors.adminToken });
    expect(archived.body.data).toHaveLength(1);
    expect(archived.body.data[0].slug).toBe('aplikimi');

    const included = await api.get('/api/admin/forms?includeDeleted=true', {
      token: actors.adminToken,
    });
    expect(included.body.data).toHaveLength(1);
  });

  it('audits the deletion with the submission count', async () => {
    const form = await createForm({ slug: 'aplikimi', title: 'Aplikimi' });
    await createSubmission({ formId: form.id });
    await createSubmission({ formId: form.id });

    await api.delete(`/api/admin/forms/${form.id}`, { token: actors.adminToken });

    const row = await latestAudit(AuditAction.FORM_DELETED);
    expect(row?.metadata).toEqual({
      slug: 'aplikimi',
      title: 'Aplikimi',
      type: FormType.SCHOOL,
      submissionCount: 2,
    });
  });

  it('404s when deleting an already-deleted form', async () => {
    const form = await createForm({ deletedAt: new Date() });

    const response = await api.delete(`/api/admin/forms/${form.id}`, {
      token: actors.adminToken,
    });

    expect(response.status).toBe(404);
  });

  it('restores a soft-deleted form but leaves it switched off', async () => {
    const form = await createForm({ slug: 'aplikimi' });
    await api.delete(`/api/admin/forms/${form.id}`, { token: actors.adminToken });

    const restored = await api
      .post(`/api/admin/forms/${form.id}/restore`, { token: actors.adminToken })
      .send();

    expect(restored.status).toBe(200);
    expect(restored.body.data).toMatchObject({ isDeleted: false, isActive: false });

    // Still not public until an editor re-activates it.
    expect((await api.get('/api/public/forms/aplikimi')).status).toBe(404);

    const row = await latestAudit(AuditAction.FORM_RESTORED);
    expect(row?.metadata).toMatchObject({ slug: 'aplikimi', isActive: false });
  });

  it('409s when restoring a form that is not deleted', async () => {
    const form = await createForm();

    const response = await api
      .post(`/api/admin/forms/${form.id}/restore`, { token: actors.adminToken })
      .send();

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('This form is not deleted.');
  });
});

describe('GET /api/admin/forms — listing', () => {
  beforeEach(async () => {
    await createForm({ slug: 'a-school', title: 'Alfa', type: FormType.SCHOOL });
    await createForm({ slug: 'b-cyber', title: 'Beta', type: FormType.CYBER, isActive: false });
    await createForm({ slug: 'c-deleted', title: 'Gama', deletedAt: new Date() });
  });

  it('hides soft-deleted rows by default', async () => {
    const response = await api.get('/api/admin/forms', { token: actors.editorToken });

    expect(response.body.data).toHaveLength(2);
    expect(response.body.meta).toMatchObject({ page: 1, pageSize: 20, total: 2, totalPages: 1 });
  });

  it('filters by type', async () => {
    const response = await api.get('/api/admin/forms?type=CYBER', {
      token: actors.editorToken,
    });

    expect(response.body.data.map((form: { slug: string }) => form.slug)).toEqual(['b-cyber']);
  });

  it('filters by isActive', async () => {
    const response = await api.get('/api/admin/forms?isActive=false', {
      token: actors.editorToken,
    });

    expect(response.body.data.map((form: { slug: string }) => form.slug)).toEqual(['b-cyber']);
  });

  it('searches title and slug case-insensitively', async () => {
    const byTitle = await api.get('/api/admin/forms?search=alf', { token: actors.editorToken });
    const bySlug = await api.get('/api/admin/forms?search=B-CY', { token: actors.editorToken });

    expect(byTitle.body.data).toHaveLength(1);
    expect(bySlug.body.data).toHaveLength(1);
  });

  it('sorts and paginates', async () => {
    const response = await api.get('/api/admin/forms?sort=title&order=asc&pageSize=1&page=2', {
      token: actors.editorToken,
    });

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe('Beta');
    expect(response.body.meta).toMatchObject({ page: 2, pageSize: 1, total: 2, totalPages: 2 });
  });

  it('rejects a page size beyond the maximum', async () => {
    const response = await api.get('/api/admin/forms?pageSize=1000', {
      token: actors.editorToken,
    });

    expect(response.status).toBe(400);
  });

  it('reports the submission count per form', async () => {
    const form = await prisma.form.findFirstOrThrow({ where: { slug: 'a-school' } });
    await createSubmission({ formId: form.id });

    const response = await api.get('/api/admin/forms?search=a-school', {
      token: actors.editorToken,
    });

    expect(response.body.data[0].submissionCount).toBe(1);
  });
});

describe('GET /api/admin/forms/:id and /field-types', () => {
  it('returns a single live form', async () => {
    const form = await createForm({ slug: 'aplikimi' });

    const response = await api.get(`/api/admin/forms/${form.id}`, {
      token: actors.editorToken,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.slug).toBe('aplikimi');
  });

  it('404s for a soft-deleted form', async () => {
    const form = await createForm({ deletedAt: new Date() });

    expect(
      (await api.get(`/api/admin/forms/${form.id}`, { token: actors.editorToken })).status,
    ).toBe(404);
  });

  it('serves the field-type vocabulary without shadowing by /:id', async () => {
    const response = await api.get('/api/admin/forms/field-types', {
      token: actors.editorToken,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.fieldTypes).toContain('multiselect');
  });

  it('does not let /archived be captured by the /:id route', async () => {
    const response = await api.get('/api/admin/forms/archived', { token: actors.adminToken });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe('audit coverage of the form lifecycle', () => {
  it('records exactly one row per mutation and none for reads', async () => {
    const created = await create({ title: 'Cikli', type: FormType.SCHOOL });
    const id = created.body.data.id;

    await api.get(`/api/admin/forms/${id}`, { token: actors.adminToken });
    await api.patch(`/api/admin/forms/${id}`, { token: actors.adminToken }).send({ title: 'B' });
    await api.delete(`/api/admin/forms/${id}`, { token: actors.adminToken });
    await api.post(`/api/admin/forms/${id}/restore`, { token: actors.adminToken }).send();

    const actions = (await auditRows()).map((row) => row.action);
    expect(actions).toEqual([
      AuditAction.FORM_CREATED,
      AuditAction.FORM_UPDATED,
      AuditAction.FORM_DELETED,
      AuditAction.FORM_RESTORED,
    ]);
  });
});
