import { z } from 'zod';
import { TrainingCategory, TrainingFormat } from '@prisma/client';
import { FIELD_LIMITS } from '../config/constants';
import { paginationQuerySchema, searchSchema, slugSchema, sortOrderSchema } from './common.schema';

/**
 * "Pikat e Forta" — a flat list of plain-text bullets.
 *
 * Bounded on BOTH axes on purpose. `Training.strengths` is a JSON column, so without a
 * cap the only limit on what an admin can store is the 1 MB body limit; a runaway paste
 * would then be re-serialised on every public detail request. Blank entries are stripped
 * rather than rejected because the dashboard's add-row button creates an empty row by
 * design — the admin adding a row and not filling it is a UI state, not an error.
 */
const MAX_STRENGTHS = 20;
const MAX_STRENGTH_LENGTH = 300;

export const strengthsSchema = z
  .array(z.string().trim().max(MAX_STRENGTH_LENGTH))
  .max(MAX_STRENGTHS)
  .transform((entries) => entries.filter((entry) => entry.length > 0));

/**
 * Hours is an Int in the schema and a text input in the dashboard, so it arrives as a
 * string. `coerce` bridges that; the bounds keep an accidental extra digit from becoming
 * a 200-year course.
 */
const hoursSchema = z.coerce.number().int().min(1).max(2_000);

/**
 * The start date arrives as `YYYY-MM-DD` from an `<input type="date">` and is stored in a
 * DateTime column. Accepting the date-only form explicitly (rather than any parseable
 * string) keeps the stored instant predictable — midnight UTC — instead of depending on
 * whichever timezone the admin's browser happened to send.
 */
const startDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date (YYYY-MM-DD)')
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

/**
 * A URL produced by our own upload endpoint. Length-bounded and required to be
 * absolute; the service does not attempt to verify the file still exists, because a
 * deleted upload should leave a broken download link rather than block saving the
 * training.
 */
const uploadedUrlSchema = z.string().trim().url().max(FIELD_LIMITS.URL_MAX);

/**
 * `nullable().optional()` throughout the optional fields, and the distinction is
 * load-bearing on UPDATE: `undefined` means "leave this alone", `null` means "clear it".
 * Without the null case an admin could never remove a syllabus PDF or a start date once
 * set — a PATCH omitting the key is indistinguishable from one that wants it gone.
 */
export const createTrainingSchema = z.object({
  slug: slugSchema.optional(),
  title: z.string().trim().min(1).max(FIELD_LIMITS.TITLE_MAX),
  category: z.nativeEnum(TrainingCategory),

  // --- Card ---
  startDate: startDateSchema.nullable().optional(),
  format: z.nativeEnum(TrainingFormat),
  hours: hoursSchema.nullable().optional(),
  instructor: z.string().trim().max(FIELD_LIMITS.NAME_MAX).nullable().optional(),
  city: z.string().trim().max(FIELD_LIMITS.NAME_MAX).nullable().optional(),

  // --- Detail page ---
  description: z.string().trim().max(FIELD_LIMITS.CONTENT_MAX).nullable().optional(),
  strengths: strengthsSchema.optional(),
  syllabusPdf: uploadedUrlSchema.nullable().optional(),

  // The application form the detail page's "Apliko" button posts to. Required: a
  // training nobody can apply to is not a publishable training. Existence and activity
  // are checked in the service, which is the only layer that can query.
  formSlug: slugSchema,

  isActive: z.boolean().default(true),
  order: z.number().int().min(0).max(9_999).default(0),
});
export type CreateTrainingInput = z.infer<typeof createTrainingSchema>;

/** Every field optional, but at least one present — an empty PATCH is a client bug. */
export const updateTrainingSchema = createTrainingSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update.',
  });
export type UpdateTrainingInput = z.infer<typeof updateTrainingSchema>;

export const listTrainingsQuerySchema = paginationQuerySchema.extend({
  category: z.nativeEnum(TrainingCategory).optional(),
  city: z.string().trim().min(1).max(FIELD_LIMITS.NAME_MAX).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  includeDeleted: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .default('false'),
  search: searchSchema,
  /**
   * Defaults to `order` ascending, unlike every other list in this API, which defaults
   * to newest-first. A training catalogue is a CURATED sequence — the admin drags the
   * intake that is open now to the top — so creation time is the wrong default here.
   */
  sort: z.enum(['order', 'createdAt', 'updatedAt', 'title', 'startDate']).default('order'),
  order: sortOrderSchema,
});
export type ListTrainingsQuery = z.infer<typeof listTrainingsQuerySchema>;

/** Public catalogue filters. No pagination: the catalogue is a browse-all grid. */
export const publicTrainingsQuerySchema = z.object({
  category: z.nativeEnum(TrainingCategory).optional(),
  city: z.string().trim().min(1).max(FIELD_LIMITS.NAME_MAX).optional(),
});
export type PublicTrainingsQuery = z.infer<typeof publicTrainingsQuerySchema>;
