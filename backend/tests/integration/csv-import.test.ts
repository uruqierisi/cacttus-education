import { beforeEach, describe, expect, it } from 'vitest';
import { AuditAction, SubmissionStatus } from '@prisma/client';
import type { Form } from '@prisma/client';
import { prisma } from '../../src/lib/prisma';
import { CSV_IMPORT } from '../../src/config/constants';
import { api } from '../helpers/api';
import {
  SCHOOL_FIELDS,
  createActors,
  createForm,
  createSubmission,
  latestAudit,
  type Actors,
} from '../helpers/db';

let actors: Actors;
let form: Form;

beforeEach(async () => {
  actors = await createActors();
  form = await createForm({
    slug: 'shkolle',
    title: 'Shkollë',
    fields: SCHOOL_FIELDS,
  });
});

function importCsv(csv: string | Buffer, options: { formId?: string; filename?: string; contentType?: string } = {}) {
  const request = api.post('/api/admin/submissions/import', { token: actors.adminToken });

  if (options.formId !== undefined) {
    request.field('formId', options.formId);
  }

  return request.attach(
    'file',
    typeof csv === 'string' ? Buffer.from(csv, 'utf8') : csv,
    {
      filename: options.filename ?? 'leads.csv',
      contentType: options.contentType ?? 'text/csv',
    },
  );
}

const HEADER = 'Emri,Email,Telefoni,school_name,city,interests,consent';

describe('POST /api/admin/submissions/import — happy path', () => {
  it('inserts every valid row and reports the outcome', async () => {
    const csv = [
      HEADER,
      'Arta Krasniqi,arta@example.com,+38344111111,Gjimnazi Sami Frashëri,peje,ai; cyber,po',
      'Blerim Gashi,blerim@example.com,+38344222222,Gjimnazi Xhevdet Doda,prishtine,ai,jo',
    ].join('\r\n');

    const response = await importCsv(csv, { formId: form.id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      inserted: 2,
      failed: [],
      failedCount: 0,
      totalRows: 2,
      ignoredColumns: [],
    });

    const rows = await prisma.submission.findMany({ orderBy: { email: 'asc' } });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      formId: form.id,
      name: 'Arta Krasniqi',
      email: 'arta@example.com',
      phone: '+38344111111',
      status: SubmissionStatus.NEW,
    });
    expect(rows[0]?.data).toEqual({
      school_name: 'Gjimnazi Sami Frashëri',
      city: 'peje',
      interests: ['ai', 'cyber'],
      consent: true,
    });
    expect(rows[1]?.data).toMatchObject({ consent: false, interests: ['ai'] });
  });

  it('imports every row with status NEW regardless of what the file claims', async () => {
    const csv = [
      `${HEADER},Statusi`,
      'Arta,arta@example.com,+38344111111,Gjimnazi,peje,ai,po,ARCHIVED',
    ].join('\r\n');

    await importCsv(csv, { formId: form.id });

    const row = await prisma.submission.findFirstOrThrow();
    expect(row.status).toBe(SubmissionStatus.NEW);
    expect(row.data).not.toHaveProperty('Statusi');
  });

  it('accepts the English contact header aliases', async () => {
    const csv = ['Name,Email,Phone,school_name', 'Arta,arta@example.com,+38344111111,X'].join(
      '\r\n',
    );

    const response = await importCsv(csv, { formId: form.id });

    expect(response.body.data.inserted).toBe(1);
  });

  it('matches a dynamic column by its label as well as its name', async () => {
    const csv = [
      'Emri,Email,Telefoni,Emri i shkollës',
      'Arta,arta@example.com,+38344111111,Gjimnazi',
    ].join('\r\n');

    const response = await importCsv(csv, { formId: form.id });

    expect(response.body.data.inserted).toBe(1);
    expect((await prisma.submission.findFirstOrThrow()).data).toEqual({
      school_name: 'Gjimnazi',
    });
  });

  it('reports columns that matched nothing without failing the file', async () => {
    const csv = [
      'Emri,Email,Telefoni,school_name,Kolone e panjohur,Edhe nje',
      'Arta,arta@example.com,+38344111111,Gjimnazi,x,y',
    ].join('\r\n');

    const response = await importCsv(csv, { formId: form.id });

    expect(response.body.data.inserted).toBe(1);
    expect(response.body.data.ignoredColumns).toEqual(['Kolone e panjohur', 'Edhe nje']);
  });

  it('silently ignores the export-only fixed columns', async () => {
    const csv = [
      'Emri,Email,Telefoni,Forma,Tipi,Statusi,Data,school_name',
      'Arta,arta@example.com,+38344111111,Shkollë,SCHOOL,NEW,2026-01-01,Gjimnazi',
    ].join('\r\n');

    const response = await importCsv(csv, { formId: form.id });

    expect(response.body.data.ignoredColumns).toEqual([]);
    expect(response.body.data.inserted).toBe(1);
  });

  it('normalises the contact fields exactly as the public endpoint does', async () => {
    const csv = [HEADER, '  Arta  ,  ARTA@Example.COM , +38344111111 ,X,,,'].join('\r\n');

    await importCsv(csv, { formId: form.id });

    expect(await prisma.submission.findFirstOrThrow()).toMatchObject({
      name: 'Arta',
      email: 'arta@example.com',
      phone: '+38344111111',
    });
  });
});

describe('POST /api/admin/submissions/import — partial success and line numbers', () => {
  it('skips invalid rows, imports the rest and numbers the failures from the file', async () => {
    const csv = [
      HEADER, // line 1
      'Arta,arta@example.com,+38344111111,Gjimnazi,peje,ai,po', // line 2 — ok
      'Blerim,not-an-email,+38344222222,Gjimnazi,peje,ai,po', // line 3 — bad email
      'Drita,drita@example.com,+38344333333,Gjimnazi,peje,ai,po', // line 4 — ok
      'Endrit,endrit@example.com,1,Gjimnazi,peje,ai,po', // line 5 — phone too short
    ].join('\r\n');

    const response = await importCsv(csv, { formId: form.id });

    expect(response.status).toBe(200);
    expect(response.body.data.inserted).toBe(2);
    expect(response.body.data.failedCount).toBe(2);
    expect(response.body.data.totalRows).toBe(4);
    expect(response.body.data.failed.map((failure: { row: number }) => failure.row)).toEqual([
      3, 5,
    ]);
    expect(response.body.data.failed[0].reason).toMatch(/email/i);
    expect(response.body.data.failed[1].reason).toMatch(/phone/i);

    expect(await prisma.submission.count()).toBe(2);
    const emails = (await prisma.submission.findMany()).map((row) => row.email).sort();
    expect(emails).toEqual(['arta@example.com', 'drita@example.com']);
  });

  it('reports a row whose required answer is missing, naming the field', async () => {
    const csv = [
      HEADER,
      'Arta,arta@example.com,+38344111111,,peje,ai,po', // school_name is required
    ].join('\r\n');

    const response = await importCsv(csv, { formId: form.id });

    expect(response.body.data.inserted).toBe(0);
    expect(response.body.data.failed).toEqual([
      { row: 2, reason: 'school_name: Emri i shkollës is required.' },
    ]);
  });

  it('reports a row whose answer is outside the option list', async () => {
    const csv = [HEADER, 'Arta,arta@example.com,+38344111111,X,atlantis,ai,po'].join('\r\n');

    const response = await importCsv(csv, { formId: form.id });

    expect(response.body.data.failed[0]).toMatchObject({ row: 2 });
    expect(response.body.data.failed[0].reason).toMatch(/must be one of/);
  });

  it('reports a structurally broken row against its own line number', async () => {
    const csv = [
      HEADER,
      'Arta,arta@example.com,+38344111111,X,peje,ai,po',
      'Blerim,blerim@example.com,+38344222222,X,peje,ai,po,EXTRA,COLUMNS',
    ].join('\r\n');

    const response = await importCsv(csv, { formId: form.id });

    expect(response.body.data.inserted).toBe(1);
    expect(response.body.data.failed[0].row).toBe(3);
    expect(response.body.data.failed[0].reason).toMatch(/FieldMismatch/);
  });

  it('inserts nothing when every row fails, and still reports each one', async () => {
    const csv = [
      HEADER,
      'A,bad,1,X,peje,ai,po',
      'B,alsobad,2,X,peje,ai,po',
    ].join('\r\n');

    const response = await importCsv(csv, { formId: form.id });

    expect(response.body.data).toMatchObject({ inserted: 0, failedCount: 2 });
    expect(await prisma.submission.count()).toBe(0);
  });
});

describe('POST /api/admin/submissions/import — rejected files', () => {
  it('400s when the file has no name/email/phone columns', async () => {
    const csv = ['school_name,city', 'Gjimnazi,peje'].join('\r\n');

    const response = await importCsv(csv, { formId: form.id });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toMatch(/must contain the columns Emri, Email and Telefoni/);
    expect(await prisma.submission.count()).toBe(0);
  });

  it('400s when only some contact columns are present', async () => {
    const csv = ['Emri,Email', 'Arta,arta@example.com'].join('\r\n');

    expect((await importCsv(csv, { formId: form.id })).status).toBe(400);
  });

  it('400s on an empty file', async () => {
    const response = await importCsv('   ', { formId: form.id });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('The CSV file is empty.');
  });

  it('400s when the upload is not a CSV', async () => {
    const response = await importCsv('%PDF-1.4', {
      formId: form.id,
      filename: 'report.pdf',
      contentType: 'application/pdf',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('The uploaded file must be a .csv file.');
  });

  it('400s when no file is attached at all', async () => {
    const response = await api
      .post('/api/admin/submissions/import', { token: actors.adminToken })
      .field('formId', form.id);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toMatch(/Attach the CSV file/);
  });

  it('400s when formId is missing', async () => {
    const response = await importCsv([HEADER, 'A,a@b.com,+38344111111,X,,,'].join('\r\n'));

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('body.formId');
  });

  it('404s for an unknown formId', async () => {
    const response = await importCsv([HEADER, 'A,a@b.com,+38344111111,X,,,'].join('\r\n'), {
      formId: 'does-not-exist',
    });

    expect(response.status).toBe(404);
  });

  it('404s for a soft-deleted form', async () => {
    await prisma.form.update({ where: { id: form.id }, data: { deletedAt: new Date() } });

    const response = await importCsv([HEADER, 'A,a@b.com,+38344111111,X,,,'].join('\r\n'), {
      formId: form.id,
    });

    expect(response.status).toBe(404);
  });

  it('400s a file with more data rows than the cap', async () => {
    const rows = Array.from(
      { length: CSV_IMPORT.MAX_ROWS + 1 },
      (_value, index) => `A${index},a${index}@example.com,+3834411${index},X,,,`,
    );

    const response = await importCsv([HEADER, ...rows].join('\r\n'), { formId: form.id });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toMatch(/more than 5000 data rows/);
    expect(await prisma.submission.count()).toBe(0);
  });

  it('413s a file above the 5 MB upload cap, aborting mid-stream', async () => {
    const oversized = Buffer.alloc(CSV_IMPORT.MAX_FILE_BYTES + 1024, 'a');

    const response = await importCsv(oversized, { formId: form.id });

    expect(response.status).toBe(413);
    expect(response.body.error.message).toMatch(/larger than 5 MB/);
  });
});

describe('POST /api/admin/submissions/import — audit', () => {
  it('records counts only, never an imported name, email or answer', async () => {
    const csv = [
      HEADER,
      'Arta Krasniqi,arta@example.com,+38344111111,Gjimnazi Sami Frashëri,peje,ai,po',
      'Bad,not-an-email,1,X,peje,ai,po',
    ].join('\r\n');

    await importCsv(csv, { formId: form.id });

    const row = await latestAudit(AuditAction.SUBMISSIONS_IMPORTED);

    expect(row).toMatchObject({
      actorId: actors.admin.id,
      entityType: 'Submission',
      entityId: null,
    });
    expect(row?.metadata).toEqual({
      formId: form.id,
      formSlug: 'shkolle',
      inserted: 1,
      failedCount: 1,
      totalRows: 2,
    });

    const serialised = JSON.stringify(row);
    expect(serialised).not.toContain('arta@example.com');
    expect(serialised).not.toContain('Arta Krasniqi');
    expect(serialised).not.toContain('Gjimnazi');
  });

  it('commits the rows and the audit row together', async () => {
    const csv = [HEADER, 'Arta,arta@example.com,+38344111111,X,,,'].join('\r\n');

    await importCsv(csv, { formId: form.id });

    expect(await prisma.submission.count()).toBe(1);
    expect(await prisma.auditLog.count({ where: { action: AuditAction.SUBMISSIONS_IMPORTED } })).toBe(
      1,
    );
  });
});

describe('CSV round trip: export then re-import', () => {
  it('re-imports an exported file to the same stored values', async () => {
    await createSubmission({
      formId: form.id,
      name: 'Arta Krasniqi',
      email: 'arta@example.com',
      phone: '+38344111111',
      data: { school_name: '=HYPERLINK("x")', city: 'peje', interests: ['ai', 'cyber'], consent: true },
    });

    const exported = await api.get(`/api/admin/forms/${form.id}/submissions/export`, {
      token: actors.adminToken,
    });
    expect(exported.status).toBe(200);

    const target = await createForm({ slug: 'shkolle-2', fields: SCHOOL_FIELDS });
    const response = await importCsv(exported.text, { formId: target.id });

    expect(response.status).toBe(200);
    expect(response.body.data.inserted).toBe(1);

    const reimported = await prisma.submission.findFirstOrThrow({
      where: { formId: target.id },
    });

    expect(reimported).toMatchObject({
      name: 'Arta Krasniqi',
      email: 'arta@example.com',
      phone: '+38344111111',
    });
    // The formula guard the writer added has been removed again.
    expect(reimported.data).toEqual({
      school_name: '=HYPERLINK("x")',
      city: 'peje',
      interests: ['ai', 'cyber'],
      consent: true,
    });
  });
});
