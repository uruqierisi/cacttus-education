import { z } from 'zod';
import { FIELD_LIMITS } from '../config/constants';
import { slugSchema } from './common.schema';

/**
 * The catalogue taxonomy, edited from the dashboard.
 *
 * `name` is the LABEL, not a machine value — it is what the admin types and what the
 * visitor reads on a filter chip. It is therefore bounded by NAME_MAX and trimmed, the
 * same treatment every other free-text label in this API gets.
 *
 * `slug` is optional on create: omitted, the service derives one from the name with the
 * shared `slugify`, which already knows how to fold Albanian diacritics ("Aftësi të
 * buta" -> "aftesi-te-buta"). It is accepted explicitly so an existing public URL can
 * be preserved when a category is recreated.
 */
export const createTrainingCategorySchema = z.object({
  name: z.string().trim().min(1).max(FIELD_LIMITS.NAME_MAX),
  slug: slugSchema.optional(),
  /** Position in the dashboard select and the public chips. Ties break on name. */
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});
export type CreateTrainingCategoryInput = z.infer<typeof createTrainingCategorySchema>;

/**
 * Every field optional — PATCH semantics. Unlike the training update schema there is no
 * `null` case to preserve: none of these three columns is nullable, so `undefined`
 * ("leave alone") is the only absent state there is.
 */
export const updateTrainingCategorySchema = createTrainingCategorySchema.partial();
export type UpdateTrainingCategoryInput = z.infer<typeof updateTrainingCategorySchema>;
