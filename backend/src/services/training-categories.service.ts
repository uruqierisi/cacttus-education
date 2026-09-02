/**
 * The catalogue taxonomy, as data.
 *
 * This used to be `enum TrainingCategory`: six values baked into the schema, with their
 * Albanian labels duplicated in the dashboard and the marketing site. Adding a seventh
 * meant a migration and three deploys. It is now a table the marketing team edits.
 *
 * The one rule this service exists to enforce is that a category IN USE cannot be
 * deleted. `Training.categoryId` is `onDelete: Restrict`, so the database would refuse
 * anyway — but it would refuse with a foreign-key violation, which reaches the admin as
 * a 500 and tells them nothing. The count here turns that into a sentence they can act
 * on, in the language the dashboard is written in.
 */
import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../lib/api-error';
import { recordAuditWithin, type AuditContext } from '../lib/audit';
import { slugify, resolveSlugCollision } from '../lib/slug';
import type {
  CreateTrainingCategoryInput,
  UpdateTrainingCategoryInput,
} from '../schemas/training-category.schema';

export type TrainingCategoryDto = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly sortOrder: number;
  /**
   * How many trainings point at this category, SOFT-DELETED ONES INCLUDED.
   *
   * That is not an oversight. A soft-deleted training keeps its row and therefore keeps
   * its foreign key, so it blocks the delete exactly as a live one does. Counting only
   * live trainings would show the admin "0 trajnime" beside a category the API then
   * refuses to delete, which is worse than the honest number.
   */
  readonly trainingCount: number;
  readonly createdAt: Date;
};

type CategoryRow = Prisma.TrainingCategoryGetPayload<{
  include: { _count: { select: { trainings: true } } };
}>;

const withCount = { _count: { select: { trainings: true } } } as const;

function toDto(row: CategoryRow): TrainingCategoryDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sortOrder,
    trainingCount: row._count.trainings,
    createdAt: row.createdAt,
  };
}

/**
 * `sortOrder` then `name`. The tiebreak matters: `sortOrder` defaults to 0, so several
 * categories created without one would otherwise come back in an order Postgres is free
 * to change between queries, and the dashboard select would appear to shuffle itself.
 */
const CATEGORY_ORDER: Prisma.TrainingCategoryOrderByWithRelationInput[] = [
  { sortOrder: 'asc' },
  { name: 'asc' },
];

export async function listTrainingCategories(): Promise<readonly TrainingCategoryDto[]> {
  const rows = await prisma.trainingCategory.findMany({
    include: withCount,
    orderBy: CATEGORY_ORDER,
  });

  return rows.map(toDto);
}

/** Both unique columns, checked before the write so the admin gets a field-level error. */
async function assertNameAndSlugAreFree(
  name: string | undefined,
  slug: string,
  excludeId?: string,
): Promise<void> {
  const clash = await prisma.trainingCategory.findFirst({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: [...(name === undefined ? [] : [{ name }]), { slug }],
    },
    select: { name: true, slug: true },
  });

  if (!clash) {
    return;
  }

  const isNameClash = name !== undefined && clash.name === name;

  throw ApiError.conflict(
    isNameClash
      ? 'Një kategori me këtë emër ekziston tashmë.'
      : 'Një kategori me këtë slug ekziston tashmë.',
    [{ field: isNameClash ? 'body.name' : 'body.slug', message: 'already taken' }],
  );
}

/** `slugify` folds the diacritics; the collision suffix keeps the result unique. */
async function deriveUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const taken = await prisma.trainingCategory.findMany({
    where: excludeId ? { id: { not: excludeId } } : {},
    select: { slug: true },
  });

  return resolveSlugCollision(slugify(name), new Set(taken.map((row) => row.slug)));
}

export async function createTrainingCategory(
  input: CreateTrainingCategoryInput,
  audit: AuditContext,
): Promise<TrainingCategoryDto> {
  const slug = input.slug ?? (await deriveUniqueSlug(input.name));

  await assertNameAndSlugAreFree(input.name, slug);

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.trainingCategory.create({
      data: { name: input.name, slug, sortOrder: input.sortOrder ?? 0 },
      include: withCount,
    });

    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.TRAINING_CATEGORY_CREATED,
      entityType: 'TrainingCategory',
      entityId: created.id,
      metadata: { name: created.name, slug: created.slug, sortOrder: created.sortOrder },
    });

    return created;
  });

  return toDto(row);
}

export async function updateTrainingCategory(
  id: string,
  input: UpdateTrainingCategoryInput,
  audit: AuditContext,
): Promise<TrainingCategoryDto> {
  const existing = await prisma.trainingCategory.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, sortOrder: true },
  });

  if (!existing) {
    throw ApiError.notFound('Training category not found.');
  }

  /*
   * Renaming deliberately does NOT re-derive the slug. The slug is the public handle —
   * `/trajnime?category=siguri-kibernetike` may already be in a bookmark or a campaign
   * link — so fixing display text must not silently break it. Changing the slug stays a
   * separate, explicit decision.
   */
  const slug = input.slug ?? existing.slug;

  if (input.name !== undefined || input.slug !== undefined) {
    await assertNameAndSlugAreFree(input.name, slug, id);
  }

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.trainingCategory.update({
      where: { id },
      data: {
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.slug === undefined ? {} : { slug: input.slug }),
        ...(input.sortOrder === undefined ? {} : { sortOrder: input.sortOrder }),
      },
      include: withCount,
    });

    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.TRAINING_CATEGORY_UPDATED,
      entityType: 'TrainingCategory',
      entityId: updated.id,
      // Before AND after. A rename is the main thing this endpoint does, and a trail
      // that records only the new name cannot answer "what was this called last month?".
      metadata: {
        before: { name: existing.name, slug: existing.slug, sortOrder: existing.sortOrder },
        after: { name: updated.name, slug: updated.slug, sortOrder: updated.sortOrder },
      },
    });

    return updated;
  });

  return toDto(row);
}

/** "3 trajnime", but "1 trajnim" — so the refusal never reads as broken Albanian. */
function trainingCountPhrase(count: number): string {
  return count === 1 ? '1 trajnim' : `${count} trajnime`;
}

/**
 * HARD delete, and the only one in this API.
 *
 * Trainings, forms and posts are soft-deleted because their rows carry history somebody
 * may still need — submissions, authorship, a public URL. A category carries none of
 * that: it is a label, and the guard below guarantees no training depends on it at the
 * moment it goes. A `deletedAt` here would only mean the unique constraints on `name`
 * and `slug` start colliding with rows nobody can see.
 */
export async function deleteTrainingCategory(id: string, audit: AuditContext): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.trainingCategory.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    });

    if (!existing) {
      throw ApiError.notFound('Training category not found.');
    }

    /*
     * Counted INSIDE the transaction, immediately before the delete. Counting outside it
     * would leave a window in which a training is reassigned to this category between
     * the check and the delete — the classic time-of-check/time-of-use gap. The FK's
     * RESTRICT still stops the write either way, so nothing can corrupt; doing the count
     * here is what turns that constraint into a sentence the admin can act on.
     */
    const inUse = await tx.training.count({ where: { categoryId: id } });

    if (inUse > 0) {
      throw ApiError.conflict(
        `Kategoria «${existing.name}» nuk mund të fshihet sepse përdoret nga ` +
          `${trainingCountPhrase(inUse)}. Zhvendos ato në një kategori tjetër dhe provo përsëri.`,
        [{ field: 'params.id', message: 'category is in use' }],
      );
    }

    await tx.trainingCategory.delete({ where: { id } });

    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.TRAINING_CATEGORY_DELETED,
      entityType: 'TrainingCategory',
      entityId: existing.id,
      metadata: { name: existing.name, slug: existing.slug },
    });
  });
}

/**
 * Resolve the `categoryId` a training write asserts.
 *
 * Called by `trainings.service` before create and update. Without it a bad id reaches
 * Postgres as a foreign-key violation and surfaces as a 500; with it the admin gets a
 * 400 naming the field, exactly as `assertFormSlugUsable` does for `formSlug`.
 */
export async function assertCategoryIdExists(categoryId: string): Promise<void> {
  const category = await prisma.trainingCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw ApiError.badRequest('Unknown training category.', [
      { field: 'body.categoryId', message: 'no training category with this id' },
    ]);
  }
}
