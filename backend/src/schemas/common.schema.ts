/**
 * Schemas shared by more than one resource: path params, pagination and sorting.
 */
import { z } from 'zod';
import { FIELD_LIMITS, PAGINATION, SLUG_PATTERN } from '../config/constants';

/** cuid()s are what Prisma generates; length-bounded to keep junk out of the query. */
export const idParamSchema = z.object({
  id: z.string().trim().min(1).max(64),
});
export type IdParam = z.infer<typeof idParamSchema>;

export const slugParamSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(FIELD_LIMITS.SLUG_MAX)
    .regex(SLUG_PATTERN, 'must be a lowercase, dash-separated slug'),
});
export type SlugParam = z.infer<typeof slugParamSchema>;

export const slugSchema = slugParamSchema.shape.slug;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
});

export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

/**
 * Free-text search box. Bounded so it cannot become a giant ILIKE pattern.
 *
 * A whitespace-only search collapses to `undefined` — "no filter" — rather than failing
 * validation. This was previously `.min(1)` AFTER `.trim()`, so typing a single space in
 * any list page's search box trimmed to `""`, failed the check, and 400'd the whole
 * request: the table emptied because the user pressed the space bar. Same reasoning as
 * `strengthsSchema` in training.schema.ts — a blank entry the UI can produce by design is
 * a UI state, not a client error.
 *
 * Fixing it here rather than in each caller is deliberate: six list endpoints share this
 * schema, and the dashboard had already grown `\.trim() || undefined` in two of its five
 * search pages, which is the symptom being patched one page at a time.
 */
export const searchSchema = z
  .string()
  .trim()
  .max(120)
  .transform((value) => (value === '' ? undefined : value))
  .optional();

/** ISO date-time bound used by the submission date filters. */
export const isoDateSchema = z.coerce.date();
