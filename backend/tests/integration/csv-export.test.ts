import { beforeEach, describe, expect, it } from 'vitest';
import { AuditAction, FormType, SubmissionStatus } from '@prisma/client';
import type { Form } from '@prisma/client';
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

const BOM_BYTES = Buffer.from([0xef, 0xbb, 0xbf]);

let actors: Actors;
let school: Form;
let cyber: Form;

/** Split a CSV body into logical lines (embedded newlines are not used by these rows). */
function lines(csv: string): string[] {
  return csv.replace(/^﻿/, '').trimEnd().split('\r\n');
}

function dataRows(csv: string): string[] {
  return lines(csv).slice(1);
}

beforeEach(async () => {
  actors = await createActors();

  school = await createForm({
    slug: 'shkolle',
    title: 'Shkollë',
    type: FormType.SCHOOL,
    fields: SCHOOL_FIELDS,
  });
  cyber = await createForm({
    slug: 'kiber',
    title: 'Kiber',
    type: FormType.CYBER,
    fields: [
      {
        name: 'company',
        label: 'Kompania',
        type: 'text',
        required: false,
        order: 1,
        options: [],
      },
    ],
  });

  await createSubmission({
    formId: school.id,
    name: 'Arta Krasniqi',
    email: 'arta@example.com',
    phone: '+38344111111',
    status: SubmissionStatus.NEW,
    data: { school_name: 'Gjimnazi Sami Frashëri', interests: ['ai', 'cyber'], consent: true },
    createdAt: new Date('2026-01-10T10:00:00.000Z'),
  });
  await createSubmission({
    formId: school.id,
    name: 'Blerim Gashi',
    email: 'blerim@example.com',
    phone: '+38344222222',
    status: SubmissionStatus.CONTACTED,
    data: { school_name: 'Gjimnazi Xhevdet Doda' },
    createdAt: new Date('2026-02-10T10:00:00.000Z'),
  });
  await createSubmission({
    formId: cyber.id,
    name: 'Drita Berisha',
    email: 'drita@example.com',
    phone: '+38344333333',
    status: SubmissionStatus.NEW,
    data: { company: 'Cacttus' },
    createdAt: new Date('2026-03-10T10:00:00.000Z'),
  });
});

const exportCsv = (query = '', token = actors.editorToken) =>
  api.get(`/api/admin/submissions/export${query}`, { token });

describe('GET /api/admin/submissions/export — encoding and safety', () => {
  it('starts with the UTF-8 BOM bytes EF BB BF', async () => {
    const response = await exportCsv();

    expect(response.status).toBe(200);
    expect(Buffer.from(response.text, 'utf8').subarray(0, 3)).toEqual(BOM_BYTES);
    expect(response.text.charCodeAt(0)).toBe(0xfeff);
  });

  it('sends download headers with a day-stamped filename', async () => {
    const response = await exportCsv();
    const today = new Date().toISOString().slice(0, 10);

    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-type']).toContain('charset=utf-8');
    expect(response.headers['content-disposition']).toBe(
      `attachment; filename="aplikimet-${today}.csv"`,
    );
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-export-truncated']).toBeUndefined();
  });

  it('preserves Albanian characters in the body', async () => {
    const response = await exportCsv();

    expect(response.text).toContain('Gjimnazi Sami Frashëri');
    expect(response.text).toContain('Shkollë');
    expect(response.text).toContain('Telefoni');
  });

  it('neutralises a cell that begins with = so Excel cannot execute it', async () => {
    await createSubmission({
      formId: school.id,
      name: '=1+1+cmd|calc',
      email: 'formula@example.com',
      phone: '+38344999999',
      data: { school_name: '=HYPERLINK("http://evil.test")' },
    });

    const response = await exportCsv();

    expect(response.text).toContain('"\'=1+1+cmd|calc"');
    expect(response.text).toContain('"\'=HYPERLINK(""http://evil.test"")"');
    // The raw, unguarded payload must not appear at the start of any cell.
    expect(response.text).not.toContain(',"=1+1+cmd|calc"');
  });

  it('neutralises a leading + on a phone number too', async () => {
    const response = await exportCsv();

    expect(response.text).toContain('"\'+38344111111"');
  });

  it('emits the seven fixed headers followed by the dynamic ones', async () => {
    const response = await exportCsv();
    const header = lines(response.text)[0];

    expect(header).toBe(
      '"Emri","Email","Telefoni","Forma","Tipi","Statusi","Data","company","school_name","city","interests","consent"',
    );
  });

  it('renders a multiselect as a joined cell and a checkbox as true/false', async () => {
    const response = await exportCsv(`?formId=${school.id}&status=NEW`);

    expect(response.text).toContain('"ai; cyber"');
    expect(response.text).toContain('"true"');
  });

  it('exports a header line even when nothing matches', async () => {
    const response = await exportCsv('?type=ZHVAM');

    expect(response.status).toBe(200);
    expect(dataRows(response.text)).toEqual([]);
    expect(lines(response.text)[0]).toContain('"Emri"');
  });
});

describe('GET /api/admin/submissions/export — filters mirror the list endpoint', () => {
  const listEmails = async (query: string): Promise<string[]> => {
    const response = await api.get(`/api/admin/submissions${query}`, {
      token: actors.editorToken,
    });
    return response.body.data.map((row: { email: string }) => row.email).sort();
  };

  const exportEmails = async (query: string): Promise<string[]> => {
    const response = await exportCsv(query);
    return dataRows(response.text)
      .map((line) => line.split(',')[1]?.replace(/"/g, '') ?? '')
      .sort();
  };

  it.each([
    ['no filter', ''],
    ['status', '?status=NEW'],
    ['type', '?type=SCHOOL'],
    ['search', '?search=blerim'],
    ['date range', '?from=2026-02-01T00:00:00.000Z&to=2026-12-31T00:00:00.000Z'],
  ])('the export and the list agree for %s', async (_label, query) => {
    const [fromList, fromExport] = await Promise.all([
      listEmails(query),
      exportEmails(query),
    ]);

    expect(fromExport).toEqual(fromList);
    expect(fromExport.length).toBeGreaterThan(0);
  });

  it('the export and the list agree for a formId filter', async () => {
    const query = `?formId=${school.id}`;

    expect(await exportEmails(query)).toEqual(await listEmails(query));
    expect(await exportEmails(query)).toEqual(['arta@example.com', 'blerim@example.com']);
  });

  it('rejects the same invalid range the list endpoint rejects', async () => {
    const response = await exportCsv(
      '?from=2026-03-01T00:00:00.000Z&to=2026-01-01T00:00:00.000Z',
    );

    expect(response.status).toBe(400);
  });
});

describe('GET /api/admin/submissions/export — audit', () => {
  it('records the export with counts and filters but never a single cell of PII', async () => {
    await exportCsv(`?formId=${school.id}&status=NEW&search=arta`, actors.adminToken);

    const row = await latestAudit(AuditAction.SUBMISSIONS_EXPORTED);

    expect(row).toMatchObject({
      actorId: actors.admin.id,
      entityType: 'Submission',
      entityId: null,
    });
    expect(row?.metadata).toEqual({
      count: 1,
      truncated: false,
      filters: { formId: school.id, status: 'NEW', search: 'arta' },
    });

    const serialised = JSON.stringify(row);
    expect(serialised).not.toContain('arta@example.com');
    expect(serialised).not.toContain('Arta Krasniqi');
    expect(serialised).not.toContain('Gjimnazi');
  });

  it('renders date filters as ISO strings and omits absent ones', async () => {
    await exportCsv('?from=2026-02-01T00:00:00.000Z', actors.adminToken);

    const row = await latestAudit(AuditAction.SUBMISSIONS_EXPORTED);

    expect(row?.metadata).toEqual({
      count: 2,
      truncated: false,
      filters: { from: '2026-02-01T00:00:00.000Z' },
    });
  });

  it('writes the audit row for an EDITOR export too', async () => {
    await exportCsv('', actors.editorToken);

    const rows = await auditRows(AuditAction.SUBMISSIONS_EXPORTED);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.actorId).toBe(actors.editor.id);
  });
});

describe('GET /api/admin/forms/:id/submissions/export — per-form scope', () => {
  it('exports only that form, never another form', async () => {
    const response = await api.get(`/api/admin/forms/${school.id}/submissions/export`, {
      token: actors.adminToken,
    });

    expect(response.status).toBe(200);

    const rows = dataRows(response.text);
    expect(rows).toHaveLength(2);
    expect(response.text).toContain('arta@example.com');
    expect(response.text).toContain('blerim@example.com');
    expect(response.text).not.toContain('drita@example.com');
    expect(response.text).not.toContain('Cacttus');
  });

  it('emits the full column set for that form even with zero submissions', async () => {
    const empty = await createForm({ slug: 'bosh', fields: SCHOOL_FIELDS });

    const response = await api.get(`/api/admin/forms/${empty.id}/submissions/export`, {
      token: actors.adminToken,
    });

    expect(dataRows(response.text)).toEqual([]);
    expect(lines(response.text)[0]).toContain('"school_name"');
  });

  it('remains exportable after the form is soft-deleted (delete-with-backup flow)', async () => {
    await api.delete(`/api/admin/forms/${school.id}`, { token: actors.adminToken });

    const response = await api.get(`/api/admin/forms/${school.id}/submissions/export`, {
      token: actors.adminToken,
    });

    expect(response.status).toBe(200);
    expect(dataRows(response.text)).toHaveLength(2);
  });

  it('404s for an unknown form id', async () => {
    const response = await api.get('/api/admin/forms/missing/submissions/export', {
      token: actors.adminToken,
    });

    expect(response.status).toBe(404);
  });

  it('audits the per-form export with the form scope', async () => {
    await api.get(`/api/admin/forms/${school.id}/submissions/export`, {
      token: actors.adminToken,
    });

    const row = await latestAudit(AuditAction.SUBMISSIONS_EXPORTED);

    expect(row?.metadata).toEqual({
      count: 2,
      truncated: false,
      filters: { formId: school.id, formSlug: 'shkolle', scope: 'form' },
    });
  });

  it('falls back to raw answer keys when a form has a corrupt field config', async () => {
    const broken = await createForm({
      slug: 'i-prishur',
      fields: [{ name: 'Bad Name!' }] as never,
    });
    await createSubmission({ formId: broken.id, data: { leftover: 'value' } });

    const response = await api.get(`/api/admin/forms/${broken.id}/submissions/export`, {
      token: actors.adminToken,
    });

    // Degrades rather than 500s: the answer still exports, as a residual column.
    expect(response.status).toBe(200);
    expect(lines(response.text)[0]).toContain('"leftover"');
    expect(response.text).toContain('"value"');
  });
});
