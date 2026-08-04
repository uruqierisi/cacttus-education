/**
 * Submission service — the inbox behind every public form.
 */
import { AuditAction, Prisma, type Submission, type SubmissionStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../lib/api-error';
import { buildPaginationMeta, type PaginationMeta } from '../lib/api-response';
import { resolvePageParams, toPrismaPageArgs } from '../lib/pagination';
import { recordAuditWithin, type AuditContext } from '../lib/audit';
import { EXPORT_MAX_ROWS } from '../config/constants';
import { getActiveFormBySlug } from './forms.service';
import { validateSubmissionData } from './form-fields.service';
import type {
  CreateSubmissionInput,
  ExportSubmissionsQuery,
  ListSubmissionsQuery,
} from '../schemas/submission.schema';

export type SubmissionDto = {
  readonly id: string;
  readonly formId: string;
  readonly formSlug: string;
  readonly formTitle: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly data: Record<string, unknown>;
  readonly status: SubmissionStatus;
  readonly createdAt: Date;
};

type SubmissionWithForm = Submission & {
  form: { slug: string; title: string };
};

function toDto(row: SubmissionWithForm): SubmissionDto {
  return {
    id: row.id,
    formId: row.formId,
    formSlug: row.form.slug,
    formTitle: row.form.title,
    name: row.name,
    email: row.email,
    phone: row.phone,
    data: (row.data ?? {}) as unknown as Record<string, unknown>,
    status: row.status,
    createdAt: row.createdAt,
  };
}

const withForm = { form: { select: { slug: true, title: true } } } as const;

function buildWhere(
  filters: ExportSubmissionsQuery | ListSubmissionsQuery,
): Prisma.SubmissionWhereInput {
  const createdAt: Prisma.DateTimeFilter = {
    ...(filters.from ? { gte: filters.from } : {}),
    ...(filters.to ? { lte: filters.to } : {}),
  };

  return {
    ...(filters.formId ? { formId: filters.formId } : {}),
    // Relation filter — Postgres resolves it as a join against `forms`, so this
    // combination cannot be served by the `[formId, status, createdAt]` index the way
    // an explicit `formId` can. It stays fast because `forms` is a tiny table, but
    // prefer `formId` when the caller already knows which form it wants.
    ...(filters.type ? { form: { type: filters.type } } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.from || filters.to ? { createdAt } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
            { phone: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };
}

export async function listSubmissions(
  query: ListSubmissionsQuery,
): Promise<{ items: readonly SubmissionDto[]; meta: PaginationMeta }> {
  const page = resolvePageParams(query.page, query.pageSize);
  const where = buildWhere(query);

  const [rows, total] = await prisma.$transaction([
    prisma.submission.findMany({
      where,
      orderBy: { createdAt: query.order },
      include: withForm,
      ...toPrismaPageArgs(page),
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    items: rows.map(toDto),
    meta: buildPaginationMeta(page.page, page.pageSize, total),
  };
}

export async function getSubmissionById(id: string): Promise<SubmissionDto> {
  const row = await prisma.submission.findUnique({ where: { id }, include: withForm });

  if (!row) {
    throw ApiError.notFound('Submission not found.');
  }

  return toDto(row);
}

export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus,
  audit: AuditContext,
): Promise<SubmissionDto> {
  // `status` is read alongside `id` so the audit row can record the transition it
  // replaced. A trail that says only "set to CONTACTED" cannot answer "who archived
  // this lead?".
  const exists = await prisma.submission.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!exists) {
    throw ApiError.notFound('Submission not found.');
  }

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.submission.update({
      where: { id },
      data: { status },
      include: withForm,
    });

    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.SUBMISSION_STATUS_CHANGED,
      entityType: 'Submission',
      entityId: updated.id,
      // Transition only. `updated.data` (the visitor's answers) and the submitter's
      // name / email / phone are PII and never leave the Submission row.
      metadata: {
        from: exists.status,
        to: updated.status,
        formSlug: updated.form.slug,
      },
    });

    return updated;
  });

  return toDto(row);
}

/** Bounded export. Anything beyond EXPORT_MAX_ROWS must be narrowed with filters. */
export async function findSubmissionsForExport(
  filters: ExportSubmissionsQuery,
): Promise<readonly SubmissionDto[]> {
  const rows = await prisma.submission.findMany({
    where: buildWhere(filters),
    orderBy: { createdAt: 'desc' },
    include: withForm,
    take: EXPORT_MAX_ROWS,
  });

  return rows.map(toDto);
}

/**
 * Public entry point. Resolves the form by slug (active + not soft-deleted), validates
 * the answers against that form's field definitions, then stores the row.
 */
export async function createSubmissionForSlug(
  slug: string,
  input: CreateSubmissionInput,
): Promise<{ id: string; createdAt: Date }> {
  const form = await getActiveFormBySlug(slug);

  // Honeypot hit: pretend to succeed so the bot does not learn to adapt, but persist
  // nothing. A fake id is returned because the caller only echoes a thank-you message.
  if (input.website && input.website.trim() !== '') {
    return { id: 'discarded', createdAt: new Date() };
  }

  const data = validateSubmissionData(form.fields, input.data);

  const created = await prisma.submission.create({
    data: {
      formId: form.id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      data: data as Prisma.InputJsonValue,
    },
    select: { id: true, createdAt: true },
  });

  return created;
}

/** Counts for the dashboard home screen. */
export async function getSubmissionStats(): Promise<{
  readonly total: number;
  readonly byStatus: Record<SubmissionStatus, number>;
}> {
  // The INTERACTIVE transaction form is required here, not the array form: passing
  // `groupBy` inside `$transaction([...])` widens its return type and `_count`
  // collapses to a union, losing `_all`. The callback form preserves inference.
  // `orderBy` is likewise load-bearing for that same inference, not cosmetic.
  const [total, grouped] = await prisma.$transaction((tx) =>
    Promise.all([
      tx.submission.count(),
      tx.submission.groupBy({
        by: ['status'],
        _count: { _all: true },
        orderBy: { status: 'asc' },
      }),
    ]),
  );

  const byStatus = grouped.reduce<Record<string, number>>(
    (accumulator, row) => ({ ...accumulator, [row.status]: row._count._all }),
    { NEW: 0, CONTACTED: 0, ARCHIVED: 0 },
  );

  return { total, byStatus: byStatus as Record<SubmissionStatus, number> };
}
