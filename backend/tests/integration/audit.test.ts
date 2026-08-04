/**
 * The audit trail: append-only by construction, admin-only to read, and atomic with
 * the mutation it records.
 */
import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuditAction, Role } from '@prisma/client';
import { prisma } from '../../src/lib/prisma';
import { AUDIT_PAGINATION } from '../../src/config/constants';
import { BACKEND_ROOT } from '../env-guard';
import { api } from '../helpers/api';
import { createActors, createForm, createUser, type Actors } from '../helpers/db';

const SRC_ROOT = path.join(BACKEND_ROOT, 'src');

function sourceFiles(): readonly string[] {
  return fs
    .readdirSync(SRC_ROOT, { recursive: true, encoding: 'utf8' })
    .filter((entry) => entry.endsWith('.ts'))
    .map((entry) => path.join(SRC_ROOT, entry));
}

describe('AuditLog is append-only — static guarantees', () => {
  it('finds source files to inspect (guards against a silently empty scan)', () => {
    expect(sourceFiles().length).toBeGreaterThan(40);
  });

  it('contains NO auditLog.update / delete / deleteMany / upsert anywhere in src/', () => {
    const forbidden = /auditLog\s*\.\s*(update|updateMany|delete|deleteMany|upsert)\b/;
    const offenders: string[] = [];

    for (const file of sourceFiles()) {
      const content = fs.readFileSync(file, 'utf8');
      if (forbidden.test(content)) {
        offenders.push(path.relative(BACKEND_ROOT, file));
      }
    }

    expect(offenders).toEqual([]);
  });

  it('does write auditLog.create — proving the scan targets the right symbol', () => {
    const writers = sourceFiles().filter((file) =>
      /auditLog\s*\.\s*create\b/.test(fs.readFileSync(file, 'utf8')),
    );

    expect(writers.map((file) => path.basename(file))).toEqual(['audit.ts']);
  });

  it('routes only GET onto the audit-log router', () => {
    const routeFile = path.join(SRC_ROOT, 'routes', 'admin', 'audit-logs.routes.ts');
    const content = fs.readFileSync(routeFile, 'utf8');

    expect(/router\s*\.\s*(post|put|patch|delete)\s*\(/i.test(content)).toBe(false);
    expect(/router\s*\.\s*get\s*\(/.test(content)).toBe(true);
  });

  it('exports no create / update / delete schema for the trail', () => {
    const schema = fs.readFileSync(path.join(SRC_ROOT, 'schemas', 'audit.schema.ts'), 'utf8');
    const exported = [...schema.matchAll(/export const (\w+)/g)].map((match) => match[1] ?? '');

    expect(exported.length).toBeGreaterThan(0);
    expect(
      exported.filter((name) => /^(create|update|delete|upsert)/i.test(name)),
    ).toEqual([]);
  });
});

describe('AuditLog is append-only — over HTTP', () => {
  let actors: Actors;

  beforeEach(async () => {
    actors = await createActors();
  });

  it.each(['post', 'put', 'patch', 'delete'] as const)(
    'answers %s /api/admin/audit-logs with 404 for an ADMIN — no such route exists',
    async (method) => {
      const response = await api[method]('/api/admin/audit-logs', {
        token: actors.adminToken,
      }).send();

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    },
  );

  it.each(['post', 'patch', 'delete'] as const)(
    'answers %s /api/admin/audit-logs/:id with 404 for an ADMIN',
    async (method) => {
      await createForm();
      const row = await prisma.auditLog.create({
        data: {
          actorId: actors.admin.id,
          actorEmail: actors.admin.email,
          actorRole: Role.ADMIN,
          action: AuditAction.FORM_CREATED,
          entityType: 'Form',
        },
      });

      const response = await api[method](`/api/admin/audit-logs/${row.id}`, {
        token: actors.adminToken,
      }).send();

      expect(response.status).toBe(404);
      expect(await prisma.auditLog.count()).toBe(1);
    },
  );
});

describe('GET /api/admin/audit-logs — reads', () => {
  let actors: Actors;

  beforeEach(async () => {
    actors = await createActors();

    await prisma.auditLog.createMany({
      data: [
        {
          actorId: actors.admin.id,
          actorEmail: actors.admin.email,
          actorRole: Role.ADMIN,
          action: AuditAction.FORM_CREATED,
          entityType: 'Form',
          entityId: 'form-1',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        {
          actorId: actors.editor.id,
          actorEmail: actors.editor.email,
          actorRole: Role.EDITOR,
          action: AuditAction.FORM_UPDATED,
          entityType: 'Form',
          entityId: 'form-1',
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
        },
        {
          actorId: null,
          actorEmail: 'attacker@example.com',
          actorRole: Role.EDITOR,
          action: AuditAction.LOGIN_FAILED,
          entityType: 'Auth',
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
        },
      ],
    });
  });

  const query = (search = '') =>
    api.get(`/api/admin/audit-logs${search}`, { token: actors.adminToken });

  it('returns the trail newest first with audit-specific pagination defaults', async () => {
    const response = await query();

    expect(response.status).toBe(200);
    expect(response.body.data.map((row: { action: string }) => row.action)).toEqual([
      AuditAction.LOGIN_FAILED,
      AuditAction.FORM_UPDATED,
      AuditAction.FORM_CREATED,
    ]);
    expect(response.body.meta).toMatchObject({
      page: 1,
      pageSize: AUDIT_PAGINATION.DEFAULT_PAGE_SIZE,
      total: 3,
    });
  });

  it('filters by actorId', async () => {
    const response = await query(`?actorId=${actors.editor.id}`);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].action).toBe(AuditAction.FORM_UPDATED);
  });

  it('filters by action', async () => {
    const response = await query('?action=LOGIN_FAILED');

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].actorId).toBeNull();
    expect(response.body.data[0].actorEmail).toBe('attacker@example.com');
  });

  it('filters by entityType and entityId', async () => {
    expect((await query('?entityType=Form')).body.data).toHaveLength(2);
    expect((await query('?entityType=Auth')).body.data).toHaveLength(1);
    expect((await query('?entityType=Form&entityId=form-1')).body.data).toHaveLength(2);
    expect((await query('?entityId=nope')).body.data).toHaveLength(0);
  });

  it('filters by date range', async () => {
    const response = await query('?from=2026-01-15T00:00:00.000Z&to=2026-02-15T00:00:00.000Z');

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].action).toBe(AuditAction.FORM_UPDATED);
  });

  it('searches actorEmail only', async () => {
    expect((await query('?search=ATTACKER')).body.data).toHaveLength(1);
    expect((await query('?search=Form')).body.data).toHaveLength(0);
  });

  it('rejects an inverted date range', async () => {
    const response = await query('?from=2026-03-01T00:00:00.000Z&to=2026-01-01T00:00:00.000Z');

    expect(response.status).toBe(400);
  });

  it('rejects an unknown entityType or action', async () => {
    expect((await query('?entityType=Wormhole')).status).toBe(400);
    expect((await query('?action=NOT_A_THING')).status).toBe(400);
  });

  it('clamps the page size to the audit maximum', async () => {
    expect((await query(`?pageSize=${AUDIT_PAGINATION.MAX_PAGE_SIZE}`)).status).toBe(200);
    expect((await query(`?pageSize=${AUDIT_PAGINATION.MAX_PAGE_SIZE + 1}`)).status).toBe(400);
  });

  it('paginates', async () => {
    const response = await query('?pageSize=2&page=2');

    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta).toMatchObject({ page: 2, pageSize: 2, totalPages: 2 });
  });

  it('serves the action vocabulary from the Prisma enum', async () => {
    const response = await api.get('/api/admin/audit-logs/actions', {
      token: actors.adminToken,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.actions).toEqual(Object.values(AuditAction));
    expect(response.body.data.actions).toContain(AuditAction.SUBMISSIONS_IMPORTED);
  });
});

describe('the trail outlives the actor', () => {
  it('keeps the row with a null actorId and the email snapshot after the user is deleted', async () => {
    const { admin, adminToken } = await createActors();
    const victim = await createUser({ email: 'victim@cacttus.test', role: Role.EDITOR });

    await api
      .patch(`/api/admin/users/${victim.id}`, { token: adminToken })
      .send({ name: 'Renamed' });

    await prisma.user.delete({ where: { id: victim.id } });

    const rows = await prisma.auditLog.findMany({ where: { action: AuditAction.USER_UPDATED } });

    expect(rows).toHaveLength(1);
    // The ACTOR was the admin, who still exists; the row survives regardless.
    expect(rows[0]?.actorId).toBe(admin.id);
    expect(rows[0]?.metadata).toMatchObject({ targetEmail: 'victim@cacttus.test' });
  });

  it('nulls actorId rather than deleting the row when the ACTOR is removed', async () => {
    const { adminToken } = await createActors();
    const secondAdmin = await createUser({
      email: 'second-admin@cacttus.test',
      role: Role.ADMIN,
    });

    // The second admin performs an action, then is deleted by the first.
    await api
      .post('/api/admin/forms', { token: adminToken })
      .send({ title: 'Nga admini', type: 'SCHOOL' });

    await prisma.auditLog.create({
      data: {
        actorId: secondAdmin.id,
        actorEmail: secondAdmin.email,
        actorRole: Role.ADMIN,
        action: AuditAction.LOGIN_SUCCESS,
        entityType: 'Auth',
      },
    });

    await prisma.user.delete({ where: { id: secondAdmin.id } });

    const row = await prisma.auditLog.findFirstOrThrow({
      where: { action: AuditAction.LOGIN_SUCCESS },
    });

    expect(row.actorId).toBeNull();
    expect(row.actorEmail).toBe('second-admin@cacttus.test');
    expect(row.actorRole).toBe(Role.ADMIN);
  });
});

describe('atomicity: the mutation and its audit row commit together or not at all', () => {
  /**
   * Real Postgres, no mocks: a BEFORE INSERT trigger makes the audit write fail. The
   * soft delete and its audit row share one interactive transaction, so the form must
   * still be live afterwards.
   */
  async function withBlockedAuditInserts(body: () => Promise<void>): Promise<void> {
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION test_block_audit_insert() RETURNS trigger AS $fn$
      BEGIN
        RAISE EXCEPTION 'audit insert blocked by test';
      END;
      $fn$ LANGUAGE plpgsql;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER test_block_audit_insert_trigger
      BEFORE INSERT ON audit_logs
      FOR EACH ROW EXECUTE FUNCTION test_block_audit_insert();
    `);

    try {
      await body();
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER IF EXISTS test_block_audit_insert_trigger ON audit_logs',
      );
      await prisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS test_block_audit_insert()');
    }
  }

  it('rolls the soft delete back when the audit insert fails', async () => {
    const { adminToken } = await createActors();
    const form = await createForm({ slug: 'aplikimi' });

    await withBlockedAuditInserts(async () => {
      const response = await api.delete(`/api/admin/forms/${form.id}`, { token: adminToken });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
      // The internal cause is never leaked to the client.
      expect(JSON.stringify(response.body)).not.toContain('audit insert blocked');
    });

    const after = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });
    expect(after.deletedAt).toBeNull();
    expect(after.isActive).toBe(true);
    expect(await prisma.auditLog.count()).toBe(0);

    // The form is still publicly reachable — the delete genuinely did not happen.
    expect((await api.get('/api/public/forms/aplikimi')).status).toBe(200);
  });

  it('rolls a user creation back when the audit insert fails', async () => {
    const { adminToken } = await createActors();

    await withBlockedAuditInserts(async () => {
      const response = await api
        .post('/api/admin/users', { token: adminToken })
        .send({ email: 'ghost@cacttus.test', name: 'Ghost', password: 'LongEnough-123' });

      expect(response.status).toBe(500);
    });

    expect(await prisma.user.findUnique({ where: { email: 'ghost@cacttus.test' } })).toBeNull();
    expect(await prisma.user.count()).toBe(2);
  });

  it('rolls a CSV import back when the audit insert fails', async () => {
    const { adminToken } = await createActors();
    const form = await createForm({ slug: 'shkolle', fields: [] });

    await withBlockedAuditInserts(async () => {
      const response = await api
        .post('/api/admin/submissions/import', { token: adminToken })
        .field('formId', form.id)
        .attach(
          'file',
          Buffer.from('Emri,Email,Telefoni\r\nArta,arta@example.com,+38344111111', 'utf8'),
          { filename: 'leads.csv', contentType: 'text/csv' },
        );

      expect(response.status).toBe(500);
    });

    expect(await prisma.submission.count()).toBe(0);
  });

  it('leaves a login working even if its best-effort audit write fails', async () => {
    const { admin } = await createActors();

    await withBlockedAuditInserts(async () => {
      const response = await api
        .post('/api/auth/login')
        .send({ email: admin.email, password: 'CorrectHorse-9-Battery' });

      // Session events are deliberately best-effort: an audit-table problem must not
      // turn a valid login into a 500.
      expect(response.status).toBe(200);
      expect(typeof response.body.data.accessToken).toBe('string');
    });

    expect(await prisma.auditLog.count()).toBe(0);
  });
});
