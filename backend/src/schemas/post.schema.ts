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
  search: searchSchema,
});
export type PublicPostsQuery = z.infer<typeof publicPostsQuerySchema>;
