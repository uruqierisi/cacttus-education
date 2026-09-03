import { z } from 'zod';
import { FIELD_LIMITS } from '../config/constants';
import { paginationQuerySchema, searchSchema, slugSchema, sortOrderSchema } from './common.schema';

/** Only http(s) images — blocks `javascript:` and `data:` URLs in the cover field. */
const imageUrlSchema = z
  .string()
  .trim()
  .max(FIELD_LIMITS.URL_MAX)
  .url()
  .refine((value) => value.startsWith('https://') || value.startsWith('http://'), {
    message: 'must be an http(s) URL',
  });

export const createPostSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(FIELD_LIMITS.TITLE_MAX),
  coverImage: imageUrlSchema.nullable().default(null),
  content: z.string().min(1).max(FIELD_LIMITS.CONTENT_MAX),
  /**
   * A `post_categories` row id, or null for "no category".
   *
   * NULLABLE all the way through, unlike a training's: filing an article is optional and
   * `null` is the state every pre-existing post is in. `.nullable().default(null)` means
   * an omitted key on CREATE files the post under nothing, while on PATCH `undefined`
   * still reads as "leave alone" and an explicit `null` clears it — the same
   * undefined/null split `coverImage` above already relies on.
   */
  categoryId: z.string().trim().min(1).max(FIELD_LIMITS.NAME_MAX).nullable().default(null),
  published: z.boolean().default(false),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = createPostSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update.',
  });
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const listPostsQuerySchema = paginationQuerySchema.extend({
  /** A category row id. The dashboard holds the rows it renders the filter from. */
  categoryId: z.string().trim().min(1).max(FIELD_LIMITS.NAME_MAX).optional(),
  published: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  search: searchSchema,
  sort: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
  order: sortOrderSchema,
});
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;

/** Public feed: no `published` switch — it is forced to true in the service. */
export const publicPostsQuerySchema = paginationQuerySchema.extend({
  /** A category SLUG. The feed's filter belongs in a shareable, readable URL. */
  category: slugSchema.optional(),
  search: searchSchema,
});
export type PublicPostsQuery = z.infer<typeof publicPostsQuerySchema>;
