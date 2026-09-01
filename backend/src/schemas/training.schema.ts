import { z } from 'zod';
import { TrainingCategory, TrainingFormat, TrainingStatus } from '@prisma/client';
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
 * "Rolet e punës që mund t'i fitosh" — job titles this training prepares for.
 *
 * Same bounded-on-both-axes treatment as `strengths`, with a much tighter per-entry cap:
 * these are job titles ("Front-End Developer"), not sentences, and the page renders each
 * as a pill on one line. A 300-character "role" would wrap to a paragraph-shaped chip
 * and wreck that row, so the limit is a design constraint as much as a storage one.
 *
 * Duplicates are dropped as well as blanks. The dashboard's chip input already refuses
 * to add a repeat, but the API cannot assume its own dashboard is the only caller, and
 * the same role twice in one row reads as a bug to a visitor.
 */
const MAX_JOB_ROLES = 12;
const MAX_JOB_ROLE_LENGTH = 80;

export const jobRolesSchema = z
  .array(z.string().trim().max(MAX_JOB_ROLE_LENGTH))
  .max(MAX_JOB_ROLES)
  .transform((entries) => {
    const seen = new Set<string>();

    return entries.filter((entry) => {
      const key = entry.toLocaleLowerCase();

      if (entry.length === 0 || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  });

/**
 * Hours is an Int in the schema and a text input in the dashboard, so it arrives as a
 * string. `coerce` bridges that; the bounds keep an accidental extra digit from becoming
 * a 200-year course.
 */
const hoursSchema = z.coerce.number().int().min(1).max(2_000);

/**
 * Price in whole euros. Same string-arrives-from-a-text-input problem as `hours`, so the
 * same `coerce`. `min(0)` rather than `min(1)` because 0 is a meaningful price — a free
 * training — and rejecting it would force the admin to leave the field blank, which the
 * public page renders as "unknown" rather than "free".
 */
const priceSchema = z.coerce.number().int().min(0).max(100_000);

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
  instructorPhoto: uploadedUrlSchema.nullable().optional(),
  instructorBio: z.string().trim().max(FIELD_LIMITS.INSTRUCTOR_BIO_MAX).nullable().optional(),
  city: z.string().trim().max(FIELD_LIMITS.NAME_MAX).nullable().optional(),
  price: priceSchema.nullable().optional(),

  // --- Detail page ---
  description: z.string().trim().max(FIELD_LIMITS.CONTENT_MAX).nullable().optional(),
  strengths: strengthsSchema.optional(),
  // Not `.nullable()`, unlike the scalar optional fields above: the column is a Postgres
  // scalar list, which has no null state. Clearing the roles is sending `[]`.
  jobRoles: jobRolesSchema.optional(),
  syllabusPdf: uploadedUrlSchema.nullable().optional(),

  // The application form the detail page's "Apliko" button posts to. Required: a
  // training nobody can apply to is not a publishable training. Existence and activity
  // are checked in the service, which is the only layer that can query.
  formSlug: slugSchema,

  /**
   * Lifecycle, not visibility — see the enum comment in schema.prisma for why this is a
   * separate column from `isActive`. Defaulted rather than required so every existing
   * dashboard payload and every seed still validates unchanged.
   */
  status: z.nativeEnum(TrainingStatus).default(TrainingStatus.ACTIVE),

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
  /** Omitted means "both" — the catalogue shows finished trainings too, just badged. */
  status: z.nativeEnum(TrainingStatus).optional(),
});
export type PublicTrainingsQuery = z.infer<typeof publicTrainingsQuerySchema>;
