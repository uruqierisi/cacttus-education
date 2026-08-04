/**
 * CSV movement of the lead inbox: bulk export out, bulk import in.
 *
 * Kept out of `submissions.service.ts` so that file stays the CRUD/triage surface. This
 * module owns only the CSV-specific orchestration and REUSES what already exists:
 *   - `findSubmissionsForExport` (and therefore the single `buildWhere` filter builder)
 *     for every read, so an export can never disagree with the list it was launched from;
 *   - `getFormById` / `parseStoredFields` for the field contract;
 *   - `validateSubmissionData` — the SAME validator the public form endpoint uses — for
 *     every imported row. There is deliberately no second, import-only validator.
 *
 * AUDIT
 * -----
 * Both directions write an `AuditLog` row via `recordAuditWithin`, with COUNTS and
 * FILTERS in the metadata and never a single exported or imported cell. The metadata of
 * an export must not become a shadow copy of the PII the export moved.
 */
import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../lib/api-error';
import { logger } from '../lib/logger';
import { recordAuditWithin, type AuditContext } from '../lib/audit';
import { csvDayFilename, toCsv } from '../lib/csv';
import { decodeCsvBuffer, parseCsvRecords } from '../lib/csv-parse';
import {
  buildImportHeaderPlan,
  buildSubmissionCsvColumns,
  extractAnswerPayload,
  extractContactValues,
  resolveDynamicColumnNames,
  type CsvFormMeta,
  type CsvSubmissionRow,
} from '../lib/submission-csv';
import { CSV_IMPORT, EXPORT_MAX_ROWS } from '../config/constants';
import { findSubmissionsForExport } from './submissions.service';
import { getFormById } from './forms.service';
import { parseStoredFields, validateSubmissionData } from './form-fields.service';
import {
  csvContactSchema,
  type ExportSubmissionsQuery,
  type ImportSubmissionsInput,
} from '../schemas/submission.schema';

/** Filename prefix for every submission export. Albanian, because staff download it. */
const EXPORT_FILENAME_PREFIX = 'aplikimet';

export type CsvExportResult = {
  readonly csv: string;
  readonly filename: string;
  readonly count: number;
  /**
   * True when the result hit `EXPORT_MAX_ROWS`, i.e. rows may be missing. Surfaced to
   * the caller (and to the audit row) rather than left implicit: a silently truncated
   * backup is worse than a refused one.
   */
  readonly truncated: boolean;
};

// --- Shared helpers -------------------------------------------------------

type FormRow = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly type: CsvFormMeta['type'];
  readonly fields: Prisma.JsonValue;
};

const FORM_META_SELECT = {
  id: true,
  slug: true,
  title: true,
  type: true,
  fields: true,
} as const;

/**
 * Parse a form's stored field definitions for CSV purposes, degrading instead of
 * failing.
 *
 * `parseStoredFields` throws when a form's JSON config is malformed — correct for the
 * submission path, where an unvalidatable form must reject writes. For an EXPORT it is
 * the wrong trade: one badly hand-edited form would 500 an export covering fifty healthy
 * ones. The failure is logged loudly (never swallowed) and that form simply contributes
 * no ordered columns; its answers still appear, as residual alphabetical columns keyed
 * by the raw `data` key. The IMPORT path does not use this — it goes through
 * `getFormById`, which still refuses a corrupt config.
 */
function readFormFields(form: FormRow): CsvFormMeta {
  const base = { id: form.id, slug: form.slug, title: form.title, type: form.type };

  try {
    return { ...base, fields: parseStoredFields(form.fields) };
  } catch (error) {
    logger.warn('form has an invalid field configuration; CSV falls back to raw answer keys', {
      formId: form.id,
      formSlug: form.slug,
      reason: error instanceof Error ? error.message : String(error),
    });

    return { ...base, fields: [] };
  }
}

/** Load the column metadata for every form present in a result set, in one query. */
async function loadFormMeta(formIds: readonly string[]): Promise<Map<string, CsvFormMeta>> {
  if (formIds.length === 0) {
    return new Map();
  }

  const forms = await prisma.form.findMany({
    where: { id: { in: [...formIds] } },
    select: FORM_META_SELECT,
  });

  return new Map(forms.map((form) => [form.id, readFormFields(form)] as const));
}

function distinctFormIds(rows: readonly CsvSubmissionRow[]): readonly string[] {
  return [...new Set(rows.map((row) => row.formId))];
}

function renderCsv(
  rows: readonly CsvSubmissionRow[],
  forms: ReadonlyMap<string, CsvFormMeta>,
): CsvExportResult {
  const dynamicNames = resolveDynamicColumnNames(rows, forms);
  const columns = buildSubmissionCsvColumns(dynamicNames, forms);

  return {
    // `toCsv` prepends the UTF-8 BOM (verified in lib/csv.ts) so Excel renders ë / ç / ï
    // instead of mojibake, and neutralises formula-injection payloads per cell.
    csv: toCsv(rows, columns),
    filename: csvDayFilename(EXPORT_FILENAME_PREFIX),
    count: rows.length,
    truncated: rows.length >= EXPORT_MAX_ROWS,
  };
}

/**
 * Record an export.
 *
 * Wrapped in an interactive transaction for consistency with every other audited action
 * in this codebase, and awaited BEFORE the controller streams the file: the trail must
 * show the download even if the response then fails, never the other way round.
 */
async function recordExportAudit(
  audit: AuditContext,
  result: CsvExportResult,
  filters: Record<string, unknown>,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.SUBMISSIONS_EXPORTED,
      entityType: 'Submission',
      // A bulk action over a filtered SET, not a single row.
      entityId: null,
      // Counts and the query that produced them. NEVER the exported rows: the whole
      // point of auditing an export is to know that PII left, not to copy it again.
      metadata: {
        count: result.count,
        truncated: result.truncated,
        filters,
      },
    });
  });
}

/** Drop undefined keys and render dates as ISO, so the audit metadata reads cleanly. */
function describeFilters(filters: ExportSubmissionsQuery): Record<string, unknown> {
  return {
    ...(filters.formId === undefined ? {} : { formId: filters.formId }),
    ...(filters.type === undefined ? {} : { type: filters.type }),
    ...(filters.status === undefined ? {} : { status: filters.status }),
    ...(filters.search === undefined ? {} : { search: filters.search }),
    ...(filters.from === undefined ? {} : { from: filters.from.toISOString() }),
    ...(filters.to === undefined ? {} : { to: filters.to.toISOString() }),
  };
}

// --- Export ---------------------------------------------------------------

/**
 * Filtered export across every form (ADMIN + EDITOR).
 *
 * Honours exactly the same filters as `GET /api/admin/submissions`, because it runs
 * through the same `buildWhere` — there is no second copy of the filter logic to drift.
 */
export async function exportSubmissionsCsv(
  filters: ExportSubmissionsQuery,
  audit: AuditContext,
): Promise<CsvExportResult> {
  const rows = await findSubmissionsForExport(filters);
  const forms = await loadFormMeta(distinctFormIds(rows));
  const result = renderCsv(rows, forms);

  await recordExportAudit(audit, result, describeFilters(filters));

  return result;
}

/**
 * Export scoped to one form (ADMIN only). Powers the dashboard's delete-with-backup
 * flow: take the CSV, then soft-delete the form.
 *
 * A soft-deleted form is deliberately still exportable. The flow above ends with the
 * form archived, and being unable to re-download the backup afterwards would make the
 * feature a one-shot. Nothing new is exposed: the route is ADMIN-only and the rows were
 * already reachable through the global export.
 */
export async function exportFormSubmissionsCsv(
  formId: string,
  audit: AuditContext,
): Promise<CsvExportResult> {
  const form = await prisma.form.findUnique({ where: { id: formId }, select: FORM_META_SELECT });

  if (!form) {
    throw ApiError.notFound('Form not found.');
  }

  const meta = readFormFields(form);
  // Same query path as the global export — only the filter differs.
  const rows = await findSubmissionsForExport({ formId });
  const result = renderCsv(rows, new Map([[meta.id, meta]]));

  await recordExportAudit(audit, result, { formId, formSlug: meta.slug, scope: 'form' });

  return result;
}

// --- Import ---------------------------------------------------------------

export type ImportFailure = {
  /** 1-based CSV line number. See the note in `importSubmissionsCsv`. */
  readonly row: number;
  readonly reason: string;
};

export type ImportReport = {
  readonly inserted: number;
  /** Capped at `CSV_IMPORT.MAX_REPORTED_FAILURES`; `failedCount` is always exact. */
  readonly failed: readonly ImportFailure[];
  readonly failedCount: number;
  readonly totalRows: number;
  /** Header columns that matched no field — reported once so a mis-mapped file is obvious. */
  readonly ignoredColumns: readonly string[];
};

const MAX_REASON_LENGTH = 200;

function truncateReason(reason: string): string {
  return reason.length > MAX_REASON_LENGTH ? `${reason.slice(0, MAX_REASON_LENGTH)}…` : reason;
}

/**
 * Describe a per-row failure, or return `null` if the error is NOT a validation failure.
 *
 * A `null` return means "this is a bug, not bad data" and the caller rethrows. Row-level
 * error handling must never become a place where a database outage is quietly recorded
 * as 5 000 invalid rows.
 */
function describeRowError(error: unknown): string | null {
  if (error instanceof ApiError && error.status === 400) {
    const details = error.details.map((detail) => `${detail.field}: ${detail.message}`).join('; ');
    return truncateReason(details.length > 0 ? details : error.message);
  }

  return null;
}

type PendingRow = Prisma.SubmissionCreateManyInput;

function chunk<T>(items: readonly T[], size: number): readonly (readonly T[])[] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

/**
 * Import a CSV into one form.
 *
 * ROW NUMBERING: `row` is the 1-based line number in the uploaded file, counting the
 * header as line 1 — so the first data row is 2, which is exactly what a spreadsheet
 * shows in its row gutter. A cell containing an embedded newline shifts the numbers of
 * every row after it; that approximation is accepted because the number is a signpost
 * for a human fixing the file, not an identifier.
 *
 * PARTIAL SUCCESS: an invalid row is skipped and reported, never fatal. A 300-row file
 * with two bad phone numbers must import 298 leads, not zero.
 *
 * TRANSACTION TIMEOUT: Prisma's interactive-transaction default is 5 s, which 5 000
 * inserts can exceed. Two things address that rather than one: the rows are written in
 * `createMany` batches of CSV_IMPORT.INSERT_CHUNK_SIZE (one multi-row INSERT per batch —
 * ~10 statements for a full file, not 5 000, and well inside Postgres's 65 535 bind
 * parameters per statement), AND the timeout is raised explicitly to
 * CSV_IMPORT.TRANSACTION_TIMEOUT_MS as headroom. The inserts and the audit row share
 * that ONE transaction, so an import is never recorded without its rows, or applied
 * without its record.
 */
export async function importSubmissionsCsv(
  input: ImportSubmissionsInput,
  file: Express.Multer.File,
  audit: AuditContext,
): Promise<ImportReport> {
  // Rejects a soft-deleted or unknown form (404) and returns validated field
  // definitions — a corrupt field config must fail an import, never degrade it.
  const form = await getFormById(input.formId);

  const parsed = parseCsvRecords(decodeCsvBuffer(file.buffer), CSV_IMPORT.MAX_ROWS);
  const plan = buildImportHeaderPlan(parsed.headers, form.fields);

  if (
    plan.contactHeaders.name === undefined ||
    plan.contactHeaders.email === undefined ||
    plan.contactHeaders.phone === undefined
  ) {
    // Every submission needs all three. Failing here gives one clear message instead of
    // the same error repeated on every row of the file.
    throw ApiError.badRequest(
      'The CSV must contain the columns Emri, Email and Telefoni (or Name, Email, Phone).',
    );
  }

  const pending: PendingRow[] = [];
  const failed: ImportFailure[] = [];
  let failedCount = 0;

  const fail = (row: number, reason: string): void => {
    failedCount += 1;
    if (failed.length < CSV_IMPORT.MAX_REPORTED_FAILURES) {
      failed.push({ row, reason });
    }
  };

  parsed.records.forEach((record, index) => {
    // Header occupies line 1, so the first data record is line 2.
    const line = index + 2;
    const parseError = parsed.errorsByRecord.get(index);

    if (parseError !== undefined) {
      fail(line, truncateReason(parseError));
      return;
    }

    const contact = csvContactSchema.safeParse(extractContactValues(record, plan));

    if (!contact.success) {
      const reason = contact.error.issues
        .map((issue) => `${issue.path.join('.') || 'row'}: ${issue.message}`)
        .join('; ');
      fail(line, truncateReason(reason));
      return;
    }

    try {
      const data = validateSubmissionData(form.fields, extractAnswerPayload(record, plan));

      pending.push({
        formId: form.id,
        name: contact.data.name,
        email: contact.data.email,
        phone: contact.data.phone,
        data: data as Prisma.InputJsonValue,
      });
    } catch (error) {
      const reason = describeRowError(error);

      if (reason === null) {
        // Not a validation failure — a real fault. Let it reach the error middleware
        // with its stack rather than logging it as a bad spreadsheet row.
        throw error;
      }

      fail(line, reason);
    }
  });

  const inserted = await prisma.$transaction(
    async (tx) => {
      let written = 0;

      for (const batch of chunk(pending, CSV_IMPORT.INSERT_CHUNK_SIZE)) {
        const result = await tx.submission.createMany({ data: [...batch] });
        written += result.count;
      }

      await recordAuditWithin(tx, {
        ...audit,
        action: AuditAction.SUBMISSIONS_IMPORTED,
        entityType: 'Submission',
        entityId: null,
        // Counts only. Not one imported name, email, phone or answer.
        metadata: {
          formId: form.id,
          formSlug: form.slug,
          inserted: written,
          failedCount,
          totalRows: parsed.records.length,
        },
      });

      return written;
    },
    {
      timeout: CSV_IMPORT.TRANSACTION_TIMEOUT_MS,
      maxWait: CSV_IMPORT.TRANSACTION_MAX_WAIT_MS,
    },
  );

  logger.info('submissions imported from CSV', {
    formId: form.id,
    actorId: audit.actorId,
    inserted,
    failedCount,
    totalRows: parsed.records.length,
  });

  return {
    inserted,
    failed,
    failedCount,
    totalRows: parsed.records.length,
    ignoredColumns: plan.unknownHeaders,
  };
}
