/**
 * The blog taxonomy, as data — the same shape `training-categories.service.ts` uses.
 *
 * The one structural difference is that `Post.categoryId` is NULLABLE: posts predating
 * the column carry no category and stay perfectly valid. That shows up here twice — the
 * usage count can legitimately be zero for a category nothing has been filed under yet,
 * and the public options endpoint has to ignore uncategorised posts rather than invent a
 * chip for them.
 *
 * The rule this service exists to enforce is that a category IN USE cannot be deleted.
 * `Post.categoryId` is `onDelete: Restrict`, so the database would refuse anyway — but it
 * would refuse with a foreign-key violation, which reaches the admin as a 500 and tells
 * them nothing. The count here turns that into a sentence they can act on.
 */
import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../lib/api-error';
import { recordAuditWithin, type AuditContext } from '../lib/audit';
import { slugify, resolveSlugCollision } from '../lib/slug';
import type {
  CreatePostCategoryInput,
  UpdatePostCategoryInput,
} from '../schemas/post-category.schema';

export type PostCategoryDto = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly sortOrder: number;
  /**
   * How many posts point at this category, DRAFTS INCLUDED.
   *
   * An unpublished draft still holds the foreign key and still blocks the delete exactly
   * as a published post does. Counting only published ones would show the admin
   * "0 artikuj" beside a category the API then refuses to delete.
   */
  readonly postCount: number;
  readonly createdAt: Date;
};

type CategoryRow = Prisma.PostCategoryGetPayload<{
  include: { _count: { select: { posts: true } } };
}>;

const withCount = { _count: { select: { posts: true } } } as const;

function toDto(row: CategoryRow): PostCategoryDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sortOrder,
    postCount: row._count.posts,
    createdAt: row.createdAt,
  };
}

/**
 * `sortOrder` then `name`. The tiebreak matters: `sortOrder` defaults to 0, so several
 * categories created without one would otherwise come back in an order Postgres is free
 * to change between queries, and the dashboard select would appear to shuffle itself.
 */
const CATEGORY_ORDER: Prisma.PostCategoryOrderByWithRelationInput[] = [
  { sortOrder: 'asc' },
  { name: 'asc' },
];

export async function listPostCategories(): Promise<readonly PostCategoryDto[]> {
  const rows = await prisma.postCategory.findMany({
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
  const clash = await prisma.postCategory.findFirst({
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
  const taken = await prisma.postCategory.findMany({
    where: excludeId ? { id: { not: excludeId } } : {},
    select: { slug: true },
  });

  return resolveSlugCollision(slugify(name), new Set(taken.map((row) => row.slug)));
}

export async function createPostCategory(
  input: CreatePostCategoryInput,
  audit: AuditContext,
): Promise<PostCategoryDto> {
  const slug = input.slug ?? (await deriveUniqueSlug(input.name));

  await assertNameAndSlugAreFree(input.name, slug);

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.postCategory.create({
      data: { name: input.name, slug, sortOrder: input.sortOrder ?? 0 },
      include: withCount,
    });

    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.POST_CATEGORY_CREATED,
      entityType: 'PostCategory',
      entityId: created.id,
      metadata: { name: created.name, slug: created.slug, sortOrder: created.sortOrder },
    });

    return created;
  });

  return toDto(row);
}

export async function updatePostCategory(
  id: string,
  input: UpdatePostCategoryInput,
  audit: AuditContext,
): Promise<PostCategoryDto> {
  const existing = await prisma.postCategory.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, sortOrder: true },
  });

  if (!existing) {
    throw ApiError.notFound('Post category not found.');
  }

  /*
   * Renaming deliberately does NOT re-derive the slug. The slug is the public handle —
   * `/lajme?category=karriera` may already be in a bookmark or a campaign link — so
   * fixing display text must not silently break it. Changing the slug stays a separate,
   * explicit decision.
   */
  const slug = input.slug ?? existing.slug;

  if (input.name !== undefined || input.slug !== undefined) {
    await assertNameAndSlugAreFree(input.name, slug, id);
  }

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.postCategory.update({
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
      action: AuditAction.POST_CATEGORY_UPDATED,
      entityType: 'PostCategory',
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

/**
 * "3 artikuj", but "1 artikull" — and the pronoun that follows has to agree with it, so
 * both halves of the sentence are built here rather than the noun alone. `artikull` is
 * masculine, so the plural pronoun is `ata` and the singular `atë`.
 */
function postCountPhrase(count: number): { readonly noun: string; readonly pronoun: string } {
  return count === 1
    ? { noun: '1 artikull', pronoun: 'atë' }
    : { noun: `${count} artikuj`, pronoun: 'ata' };
}

/**
 * HARD delete, like its training counterpart.
 *
 * Posts are soft-deleted nowhere in this API and categories carry no history of their
 * own: a category is a label, and the guard below guarantees no post depends on it at
 * the moment it goes.
 */
export async function deletePostCategory(id: string, audit: AuditContext): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.postCategory.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    });

    if (!existing) {
      throw ApiError.notFound('Post category not found.');
    }

    /*
     * Counted INSIDE the transaction, immediately before the delete. Counting outside it
     * would leave a window in which a post is filed into this category between the check
     * and the delete — the classic time-of-check/time-of-use gap. The FK's RESTRICT still
     * stops the write either way, so nothing can corrupt; doing the count here is what
     * turns that constraint into a sentence the admin can act on.
     */
    const inUse = await tx.post.count({ where: { categoryId: id } });

    if (inUse > 0) {
      const { noun, pronoun } = postCountPhrase(inUse);

      throw ApiError.conflict(
        `Kategoria «${existing.name}» nuk mund të fshihet sepse përdoret nga ${noun}. ` +
          `Zhvendos ${pronoun} në një kategori tjetër dhe provo përsëri.`,
        [{ field: 'params.id', message: 'category is in use' }],
      );
    }

    await tx.postCategory.delete({ where: { id } });

    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.POST_CATEGORY_DELETED,
      entityType: 'PostCategory',
      entityId: existing.id,
      metadata: { name: existing.name, slug: existing.slug },
    });
  });
}

/**
 * Resolve the `categoryId` a post write asserts.
 *
 * `null` is a legitimate value — "file this under nothing" — so only a non-null id is
 * checked. Without this a bad id reaches Postgres as a foreign-key violation and
 * surfaces as a 500; with it the admin gets a 400 naming the field.
 */
export async function assertPostCategoryIdExists(categoryId: string): Promise<void> {
  const category = await prisma.postCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw ApiError.badRequest('Unknown post category.', [
      { field: 'body.categoryId', message: 'no post category with this id' },
    ]);
  }
}

/**
 * The categories the PUBLIC feed should offer as chips.
 *
 * Only those with at least one PUBLISHED post. A chip that leads to an empty list is a
 * dead end, and the same rule already governs the trainings catalogue. Uncategorised
 * posts produce no chip at all — they are reachable under "Të gjitha" and nowhere else,
 * which is the honest representation of "nobody has filed this yet".
 */
export async function getPublicPostCategories(): Promise<
  readonly { readonly name: string; readonly slug: string }[]
> {
  const rows = await prisma.postCategory.findMany({
    where: { posts: { some: { published: true } } },
    select: { name: true, slug: true },
    orderBy: CATEGORY_ORDER,
  });

  return rows;
}
