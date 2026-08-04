import { beforeEach, describe, expect, it } from 'vitest';
import { AuditAction, FormType, SubmissionStatus } from '@prisma/client';
import type { Form } from '@prisma/client';
import { prisma } from '../../src/lib/prisma';
import { api } from '../helpers/api';
import {
  auditRows,
  createActors,
  createForm,
  createSubmission,
  latestAudit,
  type Actors,
} from '../helpers/db';

let actors: Actors;
let school: Form;
let cyber: Form;

beforeEach(async () => {
  actors = await createActors();

  school = await createForm({ slug: 'shkolle', title: 'Shkollë', type: FormType.SCHOOL });
  cyber = await createForm({ slug: 'kiber', title: 'Kiber', type: FormType.CYBER });

  await createSubmission({
    formId: school.id,
    name: 'Arta Krasniqi',
    email: 'arta@example.com',
    phone: '+38344111111',
    status: SubmissionStatus.NEW,
    createdAt: new Date('2026-01-10T10:00:00.000Z'),
  });
  await createSubmission({
    formId: school.id,
    name: 'Blerim Gashi',
    email: 'blerim@example.com',
    phone: '+38344222222',
    status: SubmissionStatus.CONTACTED,
    createdAt: new Date('2026-02-10T10:00:00.000Z'),
  });
  await createSubmission({
    formId: cyber.id,
    name: 'Drita Berisha',
    email: 'drita@example.com',
    phone: '+38344333333',
    status: SubmissionStatus.NEW,
    createdAt: new Date('2026-03-10T10:00:00.000Z'),
  });
});

const list = (query = '') =>
  api.get(`/api/admin/submissions${query}`, { token: actors.editorToken });

const emailsOf = (body: { data: { email: string }[] }) =>
  body.data.map((row) => row.email).sort();

describe('GET /api/admin/submissions — filters', () => {
  it('returns every submission newest-first by default', async () => {
    const response = await list();

    expect(response.status).toBe(200);
    expect(response.body.data.map((row: { email: string }) => row.email)).toEqual([
      'drita@example.com',
      'blerim@example.com',
      'arta@example.com',
    ]);
    expect(response.body.meta.total).toBe(3);
  });

  it('joins the parent form onto every row', async () => {
    const response = await list('?formId=' + school.id);

    expect(response.body.data[0]).toMatchObject({
      formId: school.id,
      formSlug: 'shkolle',
      formTitle: 'Shkollë',
    });
  });

  it('filters by formId', async () => {
    expect(emailsOf((await list(`?formId=${school.id}`)).body)).toEqual([
      'arta@example.com',
      'blerim@example.com',
    ]);
    expect(emailsOf((await list(`?formId=${cyber.id}`)).body)).toEqual(['drita@example.com']);
  });

  it('filters by form type through the relation', async () => {
    expect(emailsOf((await list('?type=CYBER')).body)).toEqual(['drita@example.com']);
    expect(emailsOf((await list('?type=SCHOOL')).body)).toEqual([
      'arta@example.com',
      'blerim@example.com',
    ]);
    expect((await list('?type=ZHVAM')).body.data).toEqual([]);
  });

  it('filters by status', async () => {
    expect(emailsOf((await list('?status=NEW')).body)).toEqual([
      'arta@example.com',
      'drita@example.com',
    ]);
    expect(emailsOf((await list('?status=CONTACTED')).body)).toEqual(['blerim@example.com']);
    expect((await list('?status=ARCHIVED')).body.data).toEqual([]);
  });

  it('combines filters', async () => {
    expect(emailsOf((await list(`?formId=${school.id}&status=NEW`)).body)).toEqual([
      'arta@example.com',
    ]);
  });

  it('searches name, email and phone case-insensitively', async () => {
    expect(emailsOf((await list('?search=BLERIM')).body)).toEqual(['blerim@example.com']);
    expect(emailsOf((await list('?search=drita@')).body)).toEqual(['drita@example.com']);
    expect(emailsOf((await list('?search=222222')).body)).toEqual(['blerim@example.com']);
  });

  it('filters by date range', async () => {
    const response = await list('?from=2026-02-01T00:00:00.000Z&to=2026-02-28T00:00:00.000Z');

    expect(emailsOf(response.body)).toEqual(['blerim@example.com']);
  });

  it('rejects a range whose from is after its to', async () => {
    const response = await list('?from=2026-03-01T00:00:00.000Z&to=2026-01-01T00:00:00.000Z');

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('query.from');
  });

  it('paginates and can be ordered ascending', async () => {
    const response = await list('?order=asc&pageSize=2&page=1');

    expect(response.body.data.map((row: { email: string }) => row.email)).toEqual([
      'arta@example.com',
      'blerim@example.com',
    ]);
    expect(response.body.meta).toMatchObject({ total: 3, totalPages: 2 });
  });

  it('rejects an unknown status value', async () => {
    expect((await list('?status=NOPE')).status).toBe(400);
  });
});

describe('GET /api/admin/submissions/:id', () => {
  it('returns a single submission with its answers', async () => {
    const row = await createSubmission({
      formId: school.id,
      data: { school_name: 'Gjimnazi' },
    });

    const response = await api.get(`/api/admin/submissions/${row.id}`, {
      token: actors.editorToken,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.data).toEqual({ school_name: 'Gjimnazi' });
  });

  it('404s an unknown id', async () => {
    const response = await api.get('/api/admin/submissions/missing', {
      token: actors.editorToken,
    });

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Submission not found.');
  });
});

describe('PATCH /api/admin/submissions/:id/status', () => {
  it('toggles the status and writes a SUBMISSION_STATUS_CHANGED audit row', async () => {
    const row = await prisma.submission.findFirstOrThrow({
      where: { email: 'arta@example.com' },
    });

    const response = await api
      .patch(`/api/admin/submissions/${row.id}/status`, { token: actors.editorToken })
      .send({ status: SubmissionStatus.CONTACTED });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe(SubmissionStatus.CONTACTED);

    const stored = await prisma.submission.findUniqueOrThrow({ where: { id: row.id } });
    expect(stored.status).toBe(SubmissionStatus.CONTACTED);

    const audit = await latestAudit(AuditAction.SUBMISSION_STATUS_CHANGED);
    expect(audit).toMatchObject({
      actorId: actors.editor.id,
      actorEmail: actors.editor.email,
      entityType: 'Submission',
      entityId: row.id,
    });
    expect(audit?.metadata).toEqual({
      from: SubmissionStatus.NEW,
      to: SubmissionStatus.CONTACTED,
      formSlug: 'shkolle',
    });
  });

  it('never copies the lead PII into the audit metadata', async () => {
    const row = await prisma.submission.findFirstOrThrow({
      where: { email: 'arta@example.com' },
    });

    await api
      .patch(`/api/admin/submissions/${row.id}/status`, { token: actors.adminToken })
      .send({ status: SubmissionStatus.ARCHIVED });

    const audit = await latestAudit(AuditAction.SUBMISSION_STATUS_CHANGED);
    const serialised = JSON.stringify(audit);

    expect(serialised).not.toContain('arta@example.com');
    expect(serialised).not.toContain('Arta Krasniqi');
    expect(serialised).not.toContain('+38344111111');
  });

  it('records each transition in sequence', async () => {
    const row = await prisma.submission.findFirstOrThrow({
      where: { email: 'arta@example.com' },
    });

    await api
      .patch(`/api/admin/submissions/${row.id}/status`, { token: actors.adminToken })
      .send({ status: SubmissionStatus.CONTACTED });
    await api
      .patch(`/api/admin/submissions/${row.id}/status`, { token: actors.adminToken })
      .send({ status: SubmissionStatus.ARCHIVED });

    const rows = await auditRows(AuditAction.SUBMISSION_STATUS_CHANGED);
    expect(rows.map((entry) => entry.metadata)).toEqual([
      { from: 'NEW', to: 'CONTACTED', formSlug: 'shkolle' },
      { from: 'CONTACTED', to: 'ARCHIVED', formSlug: 'shkolle' },
    ]);
  });

  it('rejects an unknown status with 400 and writes no audit row', async () => {
    const row = await prisma.submission.findFirstOrThrow({
      where: { email: 'arta@example.com' },
    });

    const response = await api
      .patch(`/api/admin/submissions/${row.id}/status`, { token: actors.editorToken })
      .send({ status: 'DELETED' });

    expect(response.status).toBe(400);
    expect(await auditRows(AuditAction.SUBMISSION_STATUS_CHANGED)).toHaveLength(0);
  });

  it('404s an unknown submission', async () => {
    const response = await api
      .patch('/api/admin/submissions/missing/status', { token: actors.editorToken })
      .send({ status: SubmissionStatus.CONTACTED });

    expect(response.status).toBe(404);
  });
});

describe('GET /api/admin/submissions/stats', () => {
  it('counts the inbox by status, including the zero buckets', async () => {
    const response = await api.get('/api/admin/submissions/stats', {
      token: actors.editorToken,
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      total: 3,
      byStatus: { NEW: 2, CONTACTED: 1, ARCHIVED: 0 },
    });
  });

  it('is not shadowed by the /:id route', async () => {
    const response = await api.get('/api/admin/submissions/stats', {
      token: actors.editorToken,
    });

    expect(response.body.data).toHaveProperty('byStatus');
  });
});

describe('there is deliberately no way to create or delete a single submission', () => {
  it('404s POST /api/admin/submissions', async () => {
    const response = await api
      .post('/api/admin/submissions', { token: actors.adminToken })
      .send({ name: 'X' });

    expect(response.status).toBe(404);
  });

  it('404s DELETE /api/admin/submissions/:id', async () => {
    const row = await prisma.submission.findFirstOrThrow();

    const response = await api.delete(`/api/admin/submissions/${row.id}`, {
      token: actors.adminToken,
    });

    expect(response.status).toBe(404);
    expect(await prisma.submission.count()).toBe(3);
  });
});
