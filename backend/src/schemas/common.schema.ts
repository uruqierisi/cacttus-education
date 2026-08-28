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

/** Free-text search box. Bounded so it cannot become a giant ILIKE pattern. */
export const searchSchema = z.string().trim().min(1).max(120).optional();

/** ISO date-time bound used by the submission date filters. */
export const isoDateSchema = z.coerce.date();

/**
 * Digits, optionally preceded by one `+` for an international prefix (+383, +355, …).
 *
 * Checked AFTER whitespace is stripped, which is why the pattern itself has no allowance
 * for spaces: `"+383 44 123 456"` and `"+38344123456"` are the same number, and the one
 * that reaches the database should not depend on how the visitor happened to space it.
 * Nothing else is tolerated — letters, parentheses, dashes and slashes are rejected
 * rather than quietly stripped, because stripping them would mean silently accepting a
 * value the operator then has to guess the original of.
 */
const PHONE_PATTERN = /^\+?[0-9]{5,}$/;

/**
 * The one phone rule for the whole API.
 *
 * Deliberately a single exported schema rather than a regex each caller re-applies: the
 * public form, the dynamic `phone` field type and the CSV importer all validate contact
 * numbers, and three hand-copied rules are three rules that eventually disagree.
 */
export const phoneSchema = z
  .string()
  .trim()
  .max(FIELD_LIMITS.PHONE_MAX)
  .transform((value) => value.replace(/\s+/g, ''))
  .refine((value) => PHONE_PATTERN.test(value), {
    message: 'must be digits, optionally starting with + (e.g. +38344123456)',
  });
