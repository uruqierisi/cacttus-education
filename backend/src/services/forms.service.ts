/**
 * Form service.
 *
 * SOFT DELETE CONTRACT
 * --------------------
 * `Form` rows are never removed. Every read path composes its `where` clause from
 * `notDeleted()` (or `anyState()` for the explicit archive view), so "forgetting" the
 * filter is a visible omission in one small file rather than a leak spread across
 * controllers. Restoring is just clearing `deletedAt`.
 */
import { AuditAction, Prisma, type Form, type FormType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../lib/api-error';
import { buildPaginationMeta, type PaginationMeta } from '../lib/api-response';
import { resolvePageParams, toPrismaPageArgs } from '../lib/pagination';
import { recordAuditWithin, type AuditContext } from '../lib/audit';
import { resolveSlugCollision, slugify } from '../lib/slug';
import { parseStoredFields, type FieldDefinition } from './form-fields.service';
import type {
  CreateFormInput,
  ListArchivedFormsQuery,
  ListFormsQuery,
  UpdateFormInput,
} from '../schemas/form.schema';

export type FormDto = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly type: FormType;
  readonly fields: readonly FieldDefinition[];
  readonly isActive: boolean;
  readonly isDeleted: boolean;
  readonly submissionCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

type FormWithCount = Form & { _count?: { submissions: number } };

/** The one true "live rows" predicate. */
const notDeleted = (): Prisma.FormWhereInput => ({ deletedAt: null });

/**
 * Build a typed `orderBy`. A computed key (`{ [query.sort]: order }`) widens to a
 * string index signature that Prisma's input type rejects, so the switch is explicit.
 */
function buildOrderBy(
  sort: ListFormsQuery['sort'],
  order: ListFormsQuery['order'],
): Prisma.FormOrderByWithRelationInput {
  switch (sort) {
    case 'title':
      return { title: order };
    case 'updatedAt':
      return { updatedAt: order };
    case 'createdAt':
    default:
      return { createdAt: order };
  }
}

function toDto(form: FormWithCount): FormDto {
  return {
    id: form.id,
    slug: form.slug,
    title: form.title,
    type: form.type,
    fields: parseStoredFields(form.fields),
    isActive: form.isActive,
    isDeleted: form.deletedAt !== null,
    submissionCount: form._count?.submissions ?? 0,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
  };
}

function buildListWhere(query: ListFormsQuery): Prisma.FormWhereInput {
  const where: Prisma.FormWhereInput = query.includeDeleted ? {} : notDeleted();

  return {
    ...where,
    ...(query.type ? { type: query.type } : {}),
    ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
            { slug: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };
}

export async function listForms(
  query: ListFormsQuery,
): Promise<{ items: readonly FormDto[]; meta: PaginationMeta }> {
  const page = resolvePageParams(query.page, query.pageSize);
  const where = buildListWhere(query);

  const [rows, total] = await prisma.$transaction([
    prisma.form.findMany({
      where,
      orderBy: buildOrderBy(query.sort, query.order),
      include: { _count: { select: { submissions: true } } },
      ...toPrismaPageArgs(page),
    }),
    prisma.form.count({ where }),
  ]);

  return {
    items: rows.map(toDto),
    meta: buildPaginationMeta(page.page, page.pageSize, total),
  };
}

/**
 * ADMIN-only archive: soft-deleted rows ONLY.
 *
 * `deletedAt: { not: null }` is the exact inverse of `notDeleted()` and is written
 * here rather than passed in, so no query parameter can widen this view back to live
 * forms.
 */
export async function listArchivedForms(
  query: ListArchivedFormsQuery,
): Promise<{ items: readonly FormDto[]; meta: PaginationMeta }> {
  const page = resolvePageParams(query.page, query.pageSize);

  const where: Prisma.FormWhereInput = {
    deletedAt: { not: null },
    ...(query.type ? { type: query.type } : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
            { slug: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.form.findMany({
      where,
      orderBy: buildOrderBy(query.sort, query.order),
      include: { _count: { select: { submissions: true } } },
      ...toPrismaPageArgs(page),
    }),
    prisma.form.count({ where }),
  ]);

  return {
    items: rows.map(toDto),
    meta: buildPaginationMeta(page.page, page.pageSize, total),
  };
}

export async function getFormById(id: string): Promise<FormDto> {
  const form = await prisma.form.findFirst({
    where: { id, ...notDeleted() },
    include: { _count: { select: { submissions: true } } },
  });

  if (!form) {
    throw ApiError.notFound('Form not found.');
  }

  return toDto(form);
}

/** Public lookup: live, not soft-deleted, and switched on. */
export async function getActiveFormBySlug(slug: string): Promise<FormDto> {
  const form = await prisma.form.findFirst({
    where: { slug, isActive: true, ...notDeleted() },
  });

  if (!form) {
    throw ApiError.notFound('This form is not available.');
  }

  return toDto(form);
}

/**
 * Derive a unique slug from a title.
 *
 * Candidates are loaded in ONE query (`slug = base OR slug LIKE 'base-%'`) rather than
 * probing the database once per attempt, so creating the 5th "Aplikim" form still
 * costs a single round trip.
 *
 * The candidate set intentionally includes soft-deleted rows: `Form.slug` is uniquely
 * constrained across every row, and reusing a retired form's public URL would silently
 * re-point an old link at new content.
 */
async function deriveUniqueSlug(title: string): Promise<string> {
  const base = slugify(title);

  const conflicts = await prisma.form.findMany({
    where: { OR: [{ slug: base }, { slug: { startsWith: `${base}-` } }] },
    select: { slug: true },
  });

  return resolveSlugCollision(base, new Set(conflicts.map((row) => row.slug)));
}

async function assertSlugIsFree(slug: string, ignoreId?: string): Promise<void> {
  // Uniqueness spans soft-deleted rows too (the DB constraint does), so surface a
  // clear message instead of letting a P2002 bubble up as a generic conflict.
  const existing = await prisma.form.findUnique({ where: { slug }, select: { id: true } });

  if (existing && existing.id !== ignoreId) {
    throw ApiError.conflict('A form with this slug already exists.', [
      { field: 'body.slug', message: 'must be unique' },
    ]);
  }
}

export async function createForm(input: CreateFormInput, audit: AuditContext): Promise<FormDto> {
  // An explicit slug is honoured (and validated for uniqueness); otherwise it is
  // derived from the title, which is the normal path for the dashboard.
  let slug: string;

  if (input.slug) {
    await assertSlugIsFree(input.slug);
    slug = input.slug;
  } else {
    slug = await deriveUniqueSlug(input.title);
  }

  // The row and its audit entry commit together or not at all.
  const form = await prisma.$transaction(async (tx) => {
    const created = await tx.form.create({
      data: {
        slug,
        title: input.title,
        type: input.type,
        fields: input.fields as unknown as Prisma.InputJsonValue,
        isActive: input.isActive,
      },
      include: { _count: { select: { submissions: true } } },
    });

    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.FORM_CREATED,
      entityType: 'Form',
      entityId: created.id,
      // Field DEFINITIONS are safe to count but not to copy: they are unbounded.
      metadata: {
        slug: created.slug,
        title: created.title,
        type: created.type,
        isActive: created.isActive,
        fieldCount: input.fields.length,
      },
    });

    return created;
  });

  return toDto(form);
}

export async function updateForm(
  id: string,
  input: UpdateFormInput,
  audit: AuditContext,
): Promise<FormDto> {
  const existing = await prisma.form.findFirst({
    where: { id, ...notDeleted() },
    select: { id: true },
  });

  if (!existing) {
    throw ApiError.notFound('Form not found.');
  }

  if (input.slug) {
    await assertSlugIsFree(input.slug, id);
  }

  const data: Prisma.FormUpdateInput = {
    ...(input.slug === undefined ? {} : { slug: input.slug }),
    ...(input.title === undefined ? {} : { title: input.title }),
    ...(input.type === undefined ? {} : { type: input.type }),
    ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    ...(input.fields === undefined
      ? {}
      : { fields: input.fields as unknown as Prisma.InputJsonValue }),
  };

  const form = await prisma.$transaction(async (tx) => {
    const updated = await tx.form.update({
      where: { id },
      data,
      include: { _count: { select: { submissions: true } } },
    });

    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.FORM_UPDATED,
      entityType: 'Form',
      entityId: updated.id,
      // Which attributes were touched, not their full before/after payloads.
      metadata: {
        slug: updated.slug,
        title: updated.title,
        changed: Object.keys(data).join(','),
        ...(input.fields === undefined ? {} : { fieldCount: input.fields.length }),
      },
    });

    return updated;
  });

  return toDto(form);
}

/**
 * Soft delete: stamp `deletedAt` and switch the form off so the public endpoint stops
 * accepting submissions immediately. Existing submissions are untouched.
 */
export async function softDeleteForm(id: string, audit: AuditContext): Promise<FormDto> {
  const existing = await prisma.form.findFirst({
    where: { id, ...notDeleted() },
    select: { id: true },
  });

  if (!existing) {
    throw ApiError.notFound('Form not found.');
  }

  // Taking a public URL offline is exactly the kind of action that must never be
  // deniable, so the soft delete and its audit row share one interactive transaction:
  // if the audit insert fails, `deletedAt` is rolled back and the form stays live.
  const form = await prisma.$transaction(async (tx) => {
    const updated = await tx.form.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
      include: { _count: { select: { submissions: true } } },
    });

    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.FORM_DELETED,
      entityType: 'Form',
      entityId: updated.id,
      metadata: {
        slug: updated.slug,
        title: updated.title,
        type: updated.type,
        submissionCount: updated._count.submissions,
      },
    });

    return updated;
  });

  return toDto(form);
}

export async function restoreForm(id: string, audit: AuditContext): Promise<FormDto> {
  const existing = await prisma.form.findUnique({
    where: { id },
    select: { id: true, deletedAt: true },
  });

  if (!existing) {
    throw ApiError.notFound('Form not found.');
  }

  if (existing.deletedAt === null) {
    throw ApiError.conflict('This form is not deleted.');
  }

  const form = await prisma.$transaction(async (tx) => {
    const updated = await tx.form.update({
      where: { id },
      data: { deletedAt: null },
      include: { _count: { select: { submissions: true } } },
    });

    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.FORM_RESTORED,
      entityType: 'Form',
      entityId: updated.id,
      metadata: {
        slug: updated.slug,
        title: updated.title,
        type: updated.type,
        // Restore clears `deletedAt` only; the form stays switched off until an
        // editor re-activates it, which is worth recording explicitly.
        isActive: updated.isActive,
      },
    });

    return updated;
  });

  return toDto(form);
}
