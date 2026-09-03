/**
 * Post (blog / news) service. Feeds both the admin CMS and the public marketing feed.
 */
import { AuditAction, Prisma, type Post } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../lib/api-error';
import { buildPaginationMeta, type PaginationMeta } from '../lib/api-response';
import { resolvePageParams, toPrismaPageArgs } from '../lib/pagination';
import { recordAuditWithin, type AuditContext } from '../lib/audit';
import { assertPostCategoryIdExists } from './post-categories.service';
import { sanitizeRichText, toExcerpt } from '../lib/html';
import type {
  CreatePostInput,
  ListPostsQuery,
  PublicPostsQuery,
  UpdatePostInput,
} from '../schemas/post.schema';

const EXCERPT_LENGTH = 200;

export type PostAuthor = { readonly id: string; readonly name: string };

/**
 * The category on a post payload, or null.
 *
 * NULL IS A REAL STATE here, unlike on a training: posts predating the taxonomy carry no
 * category and are served exactly as before. Every consumer has to handle it — the
 * dashboard renders "— Pa kategori —", the public feed shows the post under "Të gjitha"
 * and draws no chip label.
 */
export type PostCategoryRef = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
};

export type PostDto = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly coverImage: string | null;
  readonly content: string;
  readonly excerpt: string;
  readonly published: boolean;
  readonly category: PostCategoryRef | null;
  readonly author: PostAuthor;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

/** The public feed omits the full body — list payloads stay small. */
export type PublicPostSummary = Omit<PostDto, 'content' | 'published'>;

type PostWithAuthor = Post & {
  author: { id: string; name: string };
  category: PostCategoryRef | null;
};

/**
 * Every read includes the category. It is a LEFT join — the relation is optional — so an
 * uncategorised post still comes back, with `category: null`.
 */
const withAuthor = {
  author: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, slug: true } },
} as const;

function toDto(post: PostWithAuthor): PostDto {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    coverImage: post.coverImage,
    content: post.content,
    excerpt: toExcerpt(post.content, EXCERPT_LENGTH),
    published: post.published,
    category: post.category,
    author: post.author,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

function toSummary(post: PostWithAuthor): PublicPostSummary {
  const { content: _content, published: _published, ...summary } = toDto(post);
  return summary;
}

/**
 * Explicit switch rather than a computed key: `{ [query.sort]: order }` widens to a
 * string index signature that Prisma's `orderBy` input type rejects.
 */
function buildOrderBy(
  sort: ListPostsQuery['sort'],
  order: ListPostsQuery['order'],
): Prisma.PostOrderByWithRelationInput {
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

function buildAdminWhere(query: ListPostsQuery): Prisma.PostWhereInput {
  return {
    ...(query.published === undefined ? {} : { published: query.published }),
    // By ID here, unlike the public feed's slug: the dashboard already holds the rows it
    // renders the filter from, and an id cannot drift under a rename.
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
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

async function assertSlugIsFree(slug: string, ignoreId?: string): Promise<void> {
  const existing = await prisma.post.findUnique({ where: { slug }, select: { id: true } });

  if (existing && existing.id !== ignoreId) {
    throw ApiError.conflict('A post with this slug already exists.', [
      { field: 'body.slug', message: 'must be unique' },
    ]);
  }
}

export async function listPosts(
  query: ListPostsQuery,
): Promise<{ items: readonly PostDto[]; meta: PaginationMeta }> {
  const page = resolvePageParams(query.page, query.pageSize);
  const where = buildAdminWhere(query);

  const [rows, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: buildOrderBy(query.sort, query.order),
      include: withAuthor,
      ...toPrismaPageArgs(page),
    }),
    prisma.post.count({ where }),
  ]);

  return {
    items: rows.map(toDto),
    meta: buildPaginationMeta(page.page, page.pageSize, total),
  };
}

export async function getPostById(id: string): Promise<PostDto> {
  const post = await prisma.post.findUnique({ where: { id }, include: withAuthor });

  if (!post) {
    throw ApiError.notFound('Post not found.');
  }

  return toDto(post);
}

export async function createPost(
  authorId: string,
  input: CreatePostInput,
  audit: AuditContext,
): Promise<PostDto> {
  await assertSlugIsFree(input.slug);

  if (input.categoryId !== null) {
    await assertPostCategoryIdExists(input.categoryId);
  }

  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.post.create({
      data: {
        slug: input.slug,
        title: input.title,
        coverImage: input.coverImage,
        content: sanitizeRichText(input.content),
        categoryId: input.categoryId,
        published: input.published,
        authorId,
      },
      include: withAuthor,
    });

    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.POST_CREATED,
      entityType: 'Post',
      entityId: created.id,
      // `content` is sanitised rich text bounded only by CONTENT_MAX (200 KB). Its
      // LENGTH is the useful signal; copying the body would bloat every row of the
      // busiest-growing table in the schema.
      metadata: {
        slug: created.slug,
        title: created.title,
        published: created.published,
        contentLength: created.content.length,
      },
    });

    return created;
  });

  return toDto(post);
}

export async function updatePost(
  id: string,
  input: UpdatePostInput,
  audit: AuditContext,
): Promise<PostDto> {
  const existing = await prisma.post.findUnique({
    where: { id },
    // `published` is read so the audit row can record the transition. "Who took this
    // article offline?" is unanswerable from an after-state alone.
    select: { id: true, published: true },
  });

  if (!existing) {
    throw ApiError.notFound('Post not found.');
  }

  if (input.slug) {
    await assertSlugIsFree(input.slug, id);
  }

  // `null` clears the category and needs no lookup; only a real id is resolved.
  if (input.categoryId !== undefined && input.categoryId !== null) {
    await assertPostCategoryIdExists(input.categoryId);
  }

  const data: Prisma.PostUpdateInput = {
    ...(input.slug === undefined ? {} : { slug: input.slug }),
    ...(input.title === undefined ? {} : { title: input.title }),
    ...(input.coverImage === undefined ? {} : { coverImage: input.coverImage }),
    ...(input.published === undefined ? {} : { published: input.published }),
    ...(input.content === undefined ? {} : { content: sanitizeRichText(input.content) }),
    ...(input.categoryId === undefined
      ? {}
      : {
          category:
            input.categoryId === null
              ? { disconnect: true }
              : { connect: { id: input.categoryId } },
        }),
  };

  const post = await prisma.$transaction(async (tx) => {
    const updated = await tx.post.update({ where: { id }, data, include: withAuthor });

    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.POST_UPDATED,
      entityType: 'Post',
      entityId: updated.id,
      // Which attributes were touched, not their before/after bodies.
      metadata: {
        slug: updated.slug,
        title: updated.title,
        changed: Object.keys(data).join(','),
        ...(input.published === undefined
          ? {}
          : { wasPublished: existing.published, published: updated.published }),
        ...(input.content === undefined ? {} : { contentLength: updated.content.length }),
      },
    });

    return updated;
  });

  return toDto(post);
}

/**
 * Posts are hard-deleted: unlike forms they own no downstream records.
 *
 * Because the row is GONE afterwards, the audit entry is the only surviving evidence
 * that the article ever existed — so its identifying fields are snapshotted into
 * `metadata` before the delete, and the delete and the log share one transaction. If
 * the audit insert fails the article is not destroyed.
 */
export async function deletePost(id: string, audit: AuditContext): Promise<void> {
  const existing = await prisma.post.findUnique({
    where: { id },
    select: { id: true, slug: true, title: true, published: true, authorId: true },
  });

  if (!existing) {
    throw ApiError.notFound('Post not found.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.post.delete({ where: { id } });

    await recordAuditWithin(tx, {
      ...audit,
      action: AuditAction.POST_DELETED,
      entityType: 'Post',
      entityId: existing.id,
      metadata: {
        slug: existing.slug,
        title: existing.title,
        published: existing.published,
        authorId: existing.authorId,
      },
    });
  });
}

export async function listPublishedPosts(
  query: PublicPostsQuery,
): Promise<{ items: readonly PublicPostSummary[]; meta: PaginationMeta }> {
  const page = resolvePageParams(query.page, query.pageSize);

  const where: Prisma.PostWhereInput = {
    published: true,
    // By SLUG, not by id: the feed's filter lives in a shareable URL, where a cuid is
    // neither readable nor stable across environments. Same contract as the catalogue.
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.search
      ? { title: { contains: query.search, mode: Prisma.QueryMode.insensitive } }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: withAuthor,
      ...toPrismaPageArgs(page),
    }),
    prisma.post.count({ where }),
  ]);

  return {
    items: rows.map(toSummary),
    meta: buildPaginationMeta(page.page, page.pageSize, total),
  };
}

export async function getPublishedPostBySlug(slug: string): Promise<PostDto> {
  const post = await prisma.post.findFirst({
    where: { slug, published: true },
    include: withAuthor,
  });

  if (!post) {
    throw ApiError.notFound('Post not found.');
  }

  return toDto(post);
}

export async function getPostStats(): Promise<{ total: number; published: number }> {
  const [total, published] = await prisma.$transaction([
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
  ]);

  return { total, published };
}
