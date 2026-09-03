import { z } from 'zod';
import { FIELD_LIMITS } from '../config/constants';
import { slugSchema } from './common.schema';

/**
 * The blog taxonomy, edited from the dashboard. Same shape as the training one.
 *
 * `name` is the LABEL, not a machine value — it is what the admin types and what the
 * visitor reads on a filter chip. `slug` is optional on create: omitted, the service
 * derives one with the shared `slugify`, which already folds Albanian diacritics.
 */
export const createPostCategorySchema = z.object({
  name: z.string().trim().min(1).max(FIELD_LIMITS.NAME_MAX),
  slug: slugSchema.optional(),
  /** Position in the dashboard select and the public chips. Ties break on name. */
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});
export type CreatePostCategoryInput = z.infer<typeof createPostCategorySchema>;

/** Every field optional — PATCH semantics. None of the three columns is nullable. */
export const updatePostCategorySchema = createPostCategorySchema.partial();
export type UpdatePostCategoryInput = z.infer<typeof updatePostCategorySchema>;
