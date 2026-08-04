/**
 * Training catalogue service.
 *
 * RELATIONSHIP TO `Form`, BECAUSE THE TWO ARE EASY TO CONFLATE
 * -----------------------------------------------------------
 * A Form is a set of QUESTIONS. A Training is a COURSE that happens to point at one.
 * They are separate resources with separate lifecycles: several trainings may share one
 * application form, and a form shared on Instagram belongs to no training at all. This
 * service therefore never creates, edits or deletes a Form — it only validates that the
 * slug a training points at names one that can actually receive applications.
 *
 * SOFT DELETE CONTRACT — identical to forms.service.ts on purpose. Rows are never
 * removed; every read path composes its `where` from `notDeleted()`, so an omission is
 * visible in this one file rather than spread across controllers.
 */
import { AuditAction, Prisma, type Training } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../lib/api-error';
import { buildPaginationMeta, type PaginationMeta } from '../lib/api-response';
import { resolvePageParams, toPrismaPageArgs } from '../lib/pagination';
import { recordAuditWithin, type AuditContext } from '../lib/audit';
import { resolveSlugCollision, slugify } from '../lib/slug';
import { logger } from '../lib/logger';
import type {
  CreateTrainingInput,
  ListTrainingsQuery,
  PublicTrainingsQuery,
  UpdateTrainingInput,
} from '../schemas/training.schema';

/**
 * Path of a training's detail page on the marketing site.
 *
 * RELATIVE, not absolute. The catalogue grid and the detail page are two routes of the
 * same SPA, so the card's "Apliko" is a client-side navigation — handing it an absolute
 * URL would force a full page reload and hard-code the public hostname into API
 * responses, which is exactly the coupling that makes a staging deploy link to
 * production. The marketing site owns its own origin; the API owns the path shape.
 */
export const TRAINING_DETAIL_PATH = '/trajnime';

export function trainingDetailPath(slug: string): string {
  return `${TRAINING_DETAIL_PATH}/${slug}`;
}

export type TrainingDto = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly category: Training['category'];
  readonly startDate: Date | null;
  readonly format: Training['format'];
  readonly hours: number | null;
  readonly instructor: string | null;
  readonly city: string | null;
  readonly description: string | null;
  readonly strengths: readonly string[];
  readonly syllabusPdf: string | null;
  readonly formSlug: string;
  /** Title of the linked form, or null when the slug no longer resolves. */
  readonly formTitle: string | null;
  readonly isActive: boolean;
  readonly isDeleted: boolean;
  readonly order: number;
  readonly submissionCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

type TrainingRow = Training & { _count?: { submissions: number } };

const notDeleted = (): Prisma.TrainingWhereInput => ({ deletedAt: null });

/** Live AND publishable — the extra predicate every public read adds. */
const publiclyVisible = (): Prisma.TrainingWhereInput => ({ deletedAt: null, isActive: true });

/**
 * Re-parse the `strengths` JSON column into a string list.
 *
 * Stored JSON is trusted less than it looks — a bad manual DB edit or a column written
 * by an older shape must degrade to "no bullets" rather than crash the public page. It
 * deliberately does NOT throw the way `parseStoredFields` does for forms: a malformed
 * field definition makes a form unusable and must be loud, whereas a malformed bullet
 * list only costs a decorative section, and taking the whole catalogue down for that
 * would be the worse failure.
 */
function parseStrengths(raw: Prisma.JsonValue | null): readonly string[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((entry): entry is string => typeof entry === 'string' && entry.trim() !== '');
}

function toDto(row: TrainingRow, formTitle: string | null): TrainingDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    startDate: row.startDate,
    format: row.format,
    hours: row.hours,
    instructor: row.instructor,
    city: row.city,
    description: row.description,
    strengths: parseStrengths(row.strengths),
    syllabusPdf: row.syllabusPdf,
    formSlug: row.formSlug,
    formTitle,
    isActive: row.isActive,
    isDeleted: row.deletedAt !== null,
    order: row.order,
    submissionCount: row._count?.submissions ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Resolve the titles of every form referenced by a page of trainings, in ONE query.
 *
 * The obvious alternative — a Prisma `include` — is not available: `formSlug` is a plain
 * column, not a relation (see the schema comment on why that denormalisation was chosen).
 * Resolving per row would then be an N+1, so the slugs are collected and looked up once.
 */
async function formTitlesBySlug(slugs: readonly string[]): Promise<ReadonlyMap<string, string>> {
  const unique = [...new Set(slugs)];

  if (unique.length === 0) {
    return new Map();
  }

  const forms = await prisma.form.findMany({
    where: { slug: { in: unique }, deletedAt: null },
    select: { slug: true, title: true },
  });

  return new Map(forms.map((form) => [form.slug, form.title]));
}

async function deriveUniqueSlug(title: string): Promise<string> {
  const base = slugify(title);

  const conflicts = await prisma.training.findMany({
    where: { OR: [{ slug: base }, { slug: { startsWith: `${base}-` } }] },
    select: { slug: true },
  });

  return resolveSlugCollision(base, new Set(conflicts.map((row) => row.slug)));
}

async function assertSlugIsFree(slug: string, ignoreId?: string): Promise<void> {
  // Uniqueness spans soft-deleted rows because the DB constraint does; surface a clear
  // message rather than letting a P2002 surface as a generic conflict.
  const existing = await prisma.training.findUnique({ where: { slug }, select: { id: true } });

  if (existing && existing.id !== ignoreId) {
    throw ApiError.conflict('A training with this slug already exists.', [
      { field: 'body.slug', message: 'must be unique' },
    ]);
  }
}

/**
 * The write-side half of the `formSlug` contract documented in schema.prisma: a training
 * may only point at a form that exists, is active and is not soft-deleted. Saving a
 * training whose Apliko button leads nowhere is the failure this prevents, and catching
 * it here means the admin sees it on the field rather than a visitor seeing it on the
 * public page.
 */
async function assertFormSlugUsable(formSlug: string): Promise<void> {
  const form = await prisma.form.findFirst({
    where: { slug: formSlug, deletedAt: null },
    select: { isActive: true },
  });

  if (!form) {
    throw ApiError.badRequest('The selected application form does not exist.', [
      { field: 'body.formSlug', message: 'no form with this slug' },
    ]);
  }

  if (!form.isActive) {
    throw ApiError.badRequest('The selected application form is switched off.', [
      { field: 'body.formSlug', message: 'form is not active' },
    ]);
  }
}

function buildOrderBy(
  sort: ListTrainingsQuery['sort'],
  order: ListTrainingsQuery['order'],
): Prisma.TrainingOrderByWithRelationInput[] {
  switch (sort) {
    case 'title':
      return [{ title: order }];
    case 'createdAt':
      return [{ createdAt: order }];
    case 'updatedAt':
      return [{ updatedAt: order }];
    case 'startDate':
      // Trainings with no date sink to the bottom either way rather than jumping to the
      // top on an ascending sort, which is what a bare nullable column would do.
      return [{ startDate: { sort: order, nulls: 'last' } }];
    case 'order':
    default:
      // `order` is admin-assigned and duplicates are expected (several rows left at 0),
      // so a second key is required or the sequence shuffles between requests.
      return [{ order: order === 'desc' ? 'desc' : 'asc' }, { createdAt: 'desc' }];
  }
}

function buildListWhere(query: ListTrainingsQuery): Prisma.TrainingWhereInput {
  return {
    ...(query.includeDeleted ? {} : notDeleted()),
    ...(query.category ? { category: query.category } : {}),
    ...(query.city ? { city: query.city } : {}),
    ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
            { slug: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
            { instructor: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };
}

export async function listTrainings(
  query: ListTrainingsQuery,
): Promise<{ items: readonly TrainingDto[]; meta: PaginationMeta }> {
  const page = resolvePageParams(query.page, query.pageSize);
  const where = buildListWhere(query);

  const [rows, total] = await prisma.$transaction([
    prisma.training.findMany({
      where,
      orderBy: buildOrderBy(query.sort, query.order),
      include: { _count: { select: { submissions: true } } },
      ...toPrismaPageArgs(page),
    }),
    prisma.training.count({ where }),
  ]);

  const titles = await formTitlesBySlug(rows.map((row) => row.formSlug));

  return {
    items: rows.map((row) => toDto(row, titles.get(row.formSlug) ?? null)),
    meta: buildPaginationMeta(page.page, page.pageSize, total),
  };
}

export async function getTrainingById(id: string): Promise<TrainingDto> {
  const row = await prisma.training.findFirst({
    where: { id, ...notDeleted() },
    include: { _count: { select: { submissions: true } } },
  });

  if (!row) {
    throw ApiError.notFound('Training not found.');
  }

  const titles = await formTitlesBySlug([row.formSlug]);

  return toDto(row, titles.get(row.formSlug) ?? null);
}

/** Active forms, for the editor's "Forma e aplikimit" dropdown. */
export async function listFormOptions(): Promise<readonly { slug: string; title: string }[]> {
  return prisma.form.findMany({
    where: { deletedAt: null, isActive: true },
    select: { slug: true, title: true },
    orderBy: { title: 'asc' },
  });
}

export async function createTraining(
  input: CreateTrainingInput,
  audit: AuditContext,
): Promise<TrainingDto> {
  await assertFormSlugUsable(input.formSlug);

  let slug: string;

  if (input.slug) {
    await assertSlugIsFree(input.slug);
    slug = input.slug;
  } else {
    slug = await deriveUniqueSlug(input.title);
  }

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.training.create({
      data: {
        slug,
        title: input.title,
        category: input.category,
        startDate: input.startDate ?? null,
        format: input.format,
        hours: input.hours ?? null,
        instructor: input.instructor ?? null,
        city: input.city ?? null,
        description: input.description ?? null,
        strengths: (input.strengths ?? []) as unknown as Prisma.InputJsonValue,
        syllabusPdf: input.syllabusPdf ?? null,
        formSlug: input.formSlug,
        isActive: input.isActive,
        order: input.order,
      },
      include: { _count: { select: { submissions: true } } },
    });

    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.TRAINING_CREATED,
      entityType: 'Training',
      entityId: created.id,
      // Shape, not contents: `description` is unbounded free text and the bullets are a
      // list, so both are summarised. The syllabus URL IS recorded — it is short, it is
      // the only trace that an upload was adopted, and uploads are not audited themselves.
      metadata: {
        slug: created.slug,
        title: created.title,
        category: created.category,
        formSlug: created.formSlug,
        isActive: created.isActive,
        order: created.order,
        strengthCount: input.strengths?.length ?? 0,
        hasDescription: Boolean(created.description),
        syllabusPdf: created.syllabusPdf,
      },
    });

    return created;
  });

  const titles = await formTitlesBySlug([row.formSlug]);

  return toDto(row, titles.get(row.formSlug) ?? null);
}

export async function updateTraining(
  id: string,
  input: UpdateTrainingInput,
  audit: AuditContext,
): Promise<TrainingDto> {
  const existing = await prisma.training.findFirst({
    where: { id, ...notDeleted() },
    select: { id: true },
  });

  if (!existing) {
    throw ApiError.notFound('Training not found.');
  }

  if (input.formSlug !== undefined) {
    await assertFormSlugUsable(input.formSlug);
  }

  if (input.slug) {
    await assertSlugIsFree(input.slug, id);
  }

  /*
   * `undefined` = leave alone, `null` = clear. Spreading conditionally on
   * `=== undefined` (rather than on falsiness) is what preserves that distinction —
   * a `?? null` here would silently make every omitted field clear itself.
   */
  const data: Prisma.TrainingUpdateInput = {
    ...(input.slug === undefined ? {} : { slug: input.slug }),
    ...(input.title === undefined ? {} : { title: input.title }),
    ...(input.category === undefined ? {} : { category: input.category }),
    ...(input.startDate === undefined ? {} : { startDate: input.startDate }),
    ...(input.format === undefined ? {} : { format: input.format }),
    ...(input.hours === undefined ? {} : { hours: input.hours }),
    ...(input.instructor === undefined ? {} : { instructor: input.instructor }),
    ...(input.city === undefined ? {} : { city: input.city }),
    ...(input.description === undefined ? {} : { description: input.description }),
    ...(input.strengths === undefined
      ? {}
      : { strengths: input.strengths as unknown as Prisma.InputJsonValue }),
    ...(input.syllabusPdf === undefined ? {} : { syllabusPdf: input.syllabusPdf }),
    ...(input.formSlug === undefined ? {} : { formSlug: input.formSlug }),
    ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    ...(input.order === undefined ? {} : { order: input.order }),
  };

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.training.update({
      where: { id },
      data,
      include: { _count: { select: { submissions: true } } },
    });

    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.TRAINING_UPDATED,
      entityType: 'Training',
      entityId: updated.id,
      metadata: {
        slug: updated.slug,
        title: updated.title,
        changed: Object.keys(data).join(','),
        formSlug: updated.formSlug,
        isActive: updated.isActive,
        ...(input.strengths === undefined ? {} : { strengthCount: input.strengths.length }),
        ...(input.syllabusPdf === undefined ? {} : { syllabusPdf: updated.syllabusPdf }),
      },
    });

    return updated;
  });

  const titles = await formTitlesBySlug([row.formSlug]);

  return toDto(row, titles.get(row.formSlug) ?? null);
}

/**
 * Soft delete. Stamps `deletedAt` AND switches the training off, so it leaves the public
 * catalogue in the same instant rather than lingering until someone also toggles
 * `isActive` — the same pairing `softDeleteForm` uses, for the same reason.
 *
 * Submissions that came from this training keep their `trainingId`: the row survives, so
 * the provenance stays readable in the inbox long after the course is retired.
 */
export async function softDeleteTraining(id: string, audit: AuditContext): Promise<TrainingDto> {
  const existing = await prisma.training.findFirst({
    where: { id, ...notDeleted() },
    select: { id: true },
  });

  if (!existing) {
    throw ApiError.notFound('Training not found.');
  }

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.training.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
      include: { _count: { select: { submissions: true } } },
    });

    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.TRAINING_DELETED,
      entityType: 'Training',
      entityId: updated.id,
      metadata: {
        slug: updated.slug,
        title: updated.title,
        category: updated.category,
        submissionCount: updated._count.submissions,
      },
    });

    return updated;
  });

  const titles = await formTitlesBySlug([row.formSlug]);

  return toDto(row, titles.get(row.formSlug) ?? null);
}

// ---------------------------------------------------------------------------
// Public catalogue
// ---------------------------------------------------------------------------

export type PublicTrainingCard = {
  readonly slug: string;
  readonly title: string;
  readonly category: Training['category'];
  readonly startDate: Date | null;
  readonly format: Training['format'];
  readonly hours: number | null;
  readonly instructor: string | null;
  readonly city: string | null;
  /** Where the card's "Apliko" leads: the DETAIL page, never the form directly. */
  readonly applyUrl: string;
};

export type PublicTrainingDetail = PublicTrainingCard & {
  /**
   * Exposed on the DETAIL payload only, never on the card list.
   *
   * The detail page's application form sends it back as `trainingId` so the submission
   * records where it came from. A cuid is an opaque handle, not a secret — and the page
   * already proves knowledge of this training by rendering it — but the catalogue grid
   * has no use for it, so it is not shipped there.
   */
  readonly id: string;
  readonly description: string | null;
  readonly strengths: readonly string[];
  readonly syllabusPdf: string | null;
  readonly formSlug: string;
  /**
   * The linked form, or null when `formSlug` no longer resolves to a live, active form.
   * This is the READ half of the contract in schema.prisma: the page hides its apply
   * section instead of the endpoint 500ing. The FIELDS are not inlined — the page fetches
   * them from the existing `GET /api/public/forms/:slug`, which already owns that shape.
   */
  readonly form: { readonly slug: string; readonly title: string } | null;
};

function toCard(row: Training): PublicTrainingCard {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    startDate: row.startDate,
    format: row.format,
    hours: row.hours,
    instructor: row.instructor,
    city: row.city,
    applyUrl: trainingDetailPath(row.slug),
  };
}

export async function listPublicTrainings(
  query: PublicTrainingsQuery,
): Promise<readonly PublicTrainingCard[]> {
  const rows = await prisma.training.findMany({
    where: {
      ...publiclyVisible(),
      ...(query.category ? { category: query.category } : {}),
      ...(query.city ? { city: query.city } : {}),
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return rows.map(toCard);
}

export async function getPublicTrainingBySlug(slug: string): Promise<PublicTrainingDetail> {
  const row = await prisma.training.findFirst({ where: { slug, ...publiclyVisible() } });

  if (!row) {
    throw ApiError.notFound('Training not found.');
  }

  const form = await prisma.form.findFirst({
    where: { slug: row.formSlug, deletedAt: null, isActive: true },
    select: { slug: true, title: true },
  });

  if (!form) {
    // Not an error for the visitor — the rest of the page is still worth reading — but
    // it IS an operational fault: someone renamed or switched off a form a live training
    // depends on. Logged so it surfaces before the "why can nobody apply?" ticket does.
    logger.warn('training points at a form that no longer resolves', {
      trainingSlug: row.slug,
      formSlug: row.formSlug,
    });
  }

  return {
    ...toCard(row),
    id: row.id,
    description: row.description,
    strengths: parseStrengths(row.strengths),
    syllabusPdf: row.syllabusPdf,
    formSlug: row.formSlug,
    form,
  };
}

/**
 * The values that actually appear on live cards, for the catalogue's filter chips.
 *
 * Derived from the DATA rather than from the enum: rendering all six categories when
 * only three have trainings gives the visitor three chips that lead to an empty grid.
 * Cities come from a free-text column, so they are de-duplicated and sorted here.
 */
export async function getPublicTrainingFilters(): Promise<{
  readonly categories: readonly Training['category'][];
  readonly cities: readonly string[];
}> {
  const rows = await prisma.training.findMany({
    where: publiclyVisible(),
    select: { category: true, city: true },
    distinct: ['category', 'city'],
  });

  const categories = [...new Set(rows.map((row) => row.category))].sort();
  const cities = [...new Set(rows.map((row) => row.city).filter((city): city is string => Boolean(city)))].sort(
    (a, b) => a.localeCompare(b, 'sq'),
  );

  return { categories, cities };
}

/**
 * Validate a client-asserted training reference for a public submission.
 *
 * PROVENANCE IS CLIENT-ASSERTED AND MUST NOT BE TRUSTED AS ANYTHING MORE. The id arrives
 * in the request body, so a determined caller can attribute their application to any live
 * training. That is accepted: the field answers "which page did this lead come from?" for
 * a human reading the inbox, and nothing branches on it. What this check buys is that the
 * column can only ever hold a real, live training id — junk, ids of deleted trainings, and
 * random strings are rejected rather than stored and rendered back into the dashboard.
 */
export async function assertTrainingIdIsLive(trainingId: string): Promise<void> {
  const training = await prisma.training.findFirst({
    where: { id: trainingId, ...publiclyVisible() },
    select: { id: true },
  });

  if (!training) {
    throw ApiError.badRequest('Unknown training.', [
      { field: 'body.trainingId', message: 'no active training with this id' },
    ]);
  }
}
